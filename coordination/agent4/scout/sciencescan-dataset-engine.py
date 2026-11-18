import concurrent.futures
from concurrent.futures import ThreadPoolExecutor
from multiprocessing.pool import ThreadPool
import pandas as pd
import PyPDF2
import spacy
import os
from spacy.matcher import PhraseMatcher
from spacy.cli.download import download
import re
from xlsxwriter import Workbook

class PdFDataExtract:
    """ this class parses pdfs"""
    def __init__(self, targetDir: str, marginals_path: str):
        """
        :param targetDir: the directory with the pdfs
        :param marginals_path: path for exece
        """
        self.marginals_path = marginals_path
        self.targetDir = targetDir
        self.pdfDirs = [os.path.join(targetDir, x) for x in os.listdir(targetDir)]
        self.doi_trigger_words = ['to cite this article', 'original article', 'abstract', 'keywords', 'research article',
                         'original research', 'key words', 'to link to this article']
        self.doi_pattern = r'\b(10\.\d{4,}(?:\.\d+)*\/\S+(?:(?!["&\'<>])\S)*)\b'
        self.replace_chars = (
            # Replacement patterns to clean up text extracted from PDFs
            (r'\s+', ' '),        # Replace multiple whitespaces with a single space
            (r'^\s+|\s+?$', ''),  # Remove leading and trailing whitespaces
            ("\\r\\n", ""),       # Remove \r\n
            ('\n\n', '\n'),       # Replace double newline with a single newline
            ('\n', ' '),          # Replace single newline with a space
            ('- ', '-'),          # Remove space after hyphen
            ('-  ', '-'),         # Remove double space after hyphen
            ('-', ''),            # Remove hyphen
            ('â€™', "'"),         # Replace special character
            ('â€œ', '“'),         # Replace left double quotation mark
            ('â€\x9d', '”'),      # Replace right double quotation mark
            ('â€˜', "'"),         # Replace left single quotation mark
            ('â€\x99', "'"),      # Replace right single quotation mark
            ('â€—', '—'),         # Replace em dash
            ('â€“', '–'),         # Replace en dash
            ('Â', ''),            # Remove non-breaking space character
            ('&amp;', '&'),       # Replace HTML entity for ampersand
            ('&nbsp;', ' '),      # Replace HTML entity for non-breaking space
        )
        self.phrase_match_counter = {}
        self.load_matcher_spacy_model()

    def load_matcher_spacy_model(self):
        # Load spaCy model and set up PhraseMatcher
        model_name = "en_core_web_sm"
        if not spacy.util.is_package(model_name):
            download(model_name)
        self.nlp = spacy.load(model_name)
        """ this is the spacy model"""
        self.phrase_matcher = PhraseMatcher(self.nlp.vocab, attr='LOWER')
        # Read phrases from the marginals file and add them to the PhraseMatcher
        phrases = pd.read_excel(self.marginals_path)
        patterns = [self.nlp(str(text.lower())) for text in phrases.iloc[:, 0] if not pd.isnull(text)]
        for x in patterns:
            self.phrase_matcher.add(x.text, None, x)    # add match case and phrase as match id to be recovered later
            self.phrase_match_counter.update({x.text: 0})

    def process_pdf(self, dir_: str) -> list[list]:
        # Process a PDF file: Extract text, identify DOI, clean text, and find matches
        filename = os.path.basename(dir_)
        try:
            # Read PDF and initialize variables
            reader = PyPDF2.PdfReader(dir_)
            print(f'\nloading: {filename}')

            doi = ''
            all_text = ""

            # Iterate through pages and extract text
            for page in reader.pages:
                text = page.extract_text()
                if len(doi) == 0:   # get doi by checking first page with the doi_trigger_words
                    text_lower = text.lower()
                    for x, y in self.replace_chars:
                        text = text_lower.replace(x, y)
                    for trigger in self.doi_trigger_words:
                        if trigger in text:
                            doi = re.findall(self.doi_pattern, text_lower)
                            doi = doi[0] if len(doi) > 0 else 'DoiParseError'
                            break

                # Replace characters in the extracted text
                for x, y in self.replace_chars:     # replace chars
                    text = text.replace(x, y)  #there was a text.lower() here but i changed it back
                all_text += text

            # Handle DOI not found scenario
            doi = 'NoDoiPage' if len(doi) == 0 else doi

            # Process the cleaned text using spaCy
            doc = self.nlp(all_text)
            matches = []

            # Extract sentences, excluding those with the word "journal"
            sentences = [x.text for x in doc.sents if 'journal' not in x.text.lower()]

            # Iterate through sentences and find matches using PhraseMatcher
            for i in range(len(sentences)):
                # print(f'{i}/{len(sentences)} matches-> {len(matches)}')

                # Skip sentences with the word "journal"
                if 'journal' in sentences[i].lower():
                    continue

                for match_id, start, end in self.phrase_matcher(self.nlp(sentences[i])):
                    # print([x for x in doc.vocab.strings])
                    marginal_match = doc.vocab.strings[match_id]
                    self.phrase_match_counter[marginal_match] += 1     # increment match counter
                    matches.append([filename, doi, marginal_match, sentences[i], sentences[i-1] if i > 0 else '',
                                    sentences[1+i] if len(sentences) > i+1 else ''])
                    print(f"matched: {doc.vocab.strings[match_id]}")

            # Print matches if found
            if len(matches) > 0:
                for entry in matches:
                    print(f'match {filename}: {entry}')
            return matches

        except Exception as e:
            # Handle exceptions during PDF parsing
            print(f'Exception during parsing {filename} -> {e}')
            return []

    def get_data(self, save_excel=True) -> pd.DataFrame:
        """
        start scanning all pdfs in 10 threads and save the excel with matched senten... and with counts...
        :param save_excel:
        :return: pandas dataframe [col, col, doi, ser]
        """
        with ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(self.process_pdf, self.pdfDirs[:200]))
        # Convert results to a DataFrame
        dict_ = {}
        for entry in results:   # convert list to dict
            if len(entry) > 0:
                for x in entry:
                    dict_.update({len(dict_): x})

        dataframe = pd.DataFrame.from_dict(dict_, orient='index')   # convert dict to dataframe
        dataframe = dataframe.rename(columns={x: y for x, y in zip(dataframe.columns,
                            ["Filename", "DOI", "Marginal Match Sentence", "Match sentence", "Sentence Before Match", "Sentence after Match"])})

        match_counter = pd.DataFrame.from_dict(self.phrase_match_counter, orient='index')  # convert dict to dataframe

        if save_excel:
            dataframe.to_excel(os.path.join(self.targetDir, "output.xlsx"))
            match_counter.to_excel(os.path.join(self.targetDir, "matchcounts.xlsx"))
        print("finito!!")
        return dataframe


if __name__ == '__main__':
    target_folder = "pdfs"
    marginals_path = 'Nonsignificant incorrect2.xlsx'
    abs_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), target_folder)
    processor = PdFDataExtract(targetDir=abs_path, marginals_path=marginals_path)
    data = processor.get_data()


