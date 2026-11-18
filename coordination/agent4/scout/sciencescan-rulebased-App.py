import base64
import io
import os
import fitz  # PyMuPDF
import rlcompleter
import pandas as pd
import math
import csv
import re
from urllib.parse import urlparse
from collections import defaultdict
from flask import Flask, render_template, request
from PyPDF2 import PdfReader, PdfWriter

app = Flask(__name__, static_url_path='/static')
app.config['UPLOAD_FOLDER'] = 'uploads'

#change path to your local path
marginally_sig = "./Nonsignificant incorrect2.xlsx"
#bold_statements = "./bold statements.xlsx"

marg_df = pd.read_excel(marginally_sig)
targets = marg_df.iloc[:, 0].tolist()
#removes NAN from targets list
target_words = [value for value in targets if not (isinstance(value, float) and math.isnan(value))]

def highlight_sentences(file, words):
    try:
        # Read the uploaded file content
        file_content = file.read()
        # Initialize the PyMuPDF document
        doc = fitz.open(stream=file_content, filetype="pdf")
        # Initialize a BytesIO object to store the annotated PDF
        output_pdf = io.BytesIO()
        found_word = ''
        found = []
        phrases = []
        first_match = None
        for page_num in range(doc.page_count):
            page = doc[page_num]
            # Extract text from the page
            text = page.get_text()
            # Split the text into sentences
            sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
            print(sentences)
            for sentence in sentences:
                # Check if any target words are present in the sentence
                for word in words:
                    if word.lower() in sentence.lower():  
                        #print word that was found
                        found_word = word
                        if found_word not in found:
                          found.append(f'"{found_word}" (p.{page_num + 1})')
                          phrases.append(sentence)
                        #We want to save the page with first match, to show this page first in result
                        if first_match is None:
                            first_match = page_num + 1
                        print("match found " + found_word)
                        print("match list")
                        print(found)
                        # Find sentence with matching word
                        text_instances = page.search_for(sentence)
                        word_instances = page.search_for(word)
                        #page.add_squiggly_annot(text_instances) ##can be used to add underlining
                        #page.add_highlight_annot(text_instances)
                        highlight = page.add_highlight_annot(text_instances)
                        highlight.set_colors(stroke=[1, 0.89, 0.78]) #light orange highlight
                        highlight.update()
                        #put rectangle around critical words that where found
                        for word_instance in word_instances:
                          rect = fitz.Rect(word_instance)
                          page.add_rect_annot(rect)

        # Save the annotated PDF to the BytesIO object
        doc.save(output_pdf)
        doc.close()

        # Get the content of the BytesIO object
        annotated_pdf_data = output_pdf.getvalue()
        print("FOUND WORD" + found_word)
        print("FOUND LIST")
        print(found)
        return annotated_pdf_data, found, first_match, phrases

    except Exception as e:
        # Print any exceptions for debugging
        print(f"Error in highlight_sentences: {e}")
        return b""


#transform pdf to clean text
def clean_pdf(text):
    # Cleaning steps
    text = re.sub(r'\s+', ' ', text)  # Replace multiple whitespaces with a single space
    text = text.strip()  # Remove leading and trailing whitespaces
    text = text.replace('\r\n', ' ')  # Remove \r\n
    text = text.replace('\n\n', '\n')  # Replace double newline with a single newline
    text = text.replace('\n', ' ')  # Replace single newline with a space
    text = text.replace('- ', '-')  # Remove space after hyphen
    text = text.replace('-  ', '-')  # Remove double space after hyphen
    text = text.replace('-', '')  # Remove hyphen
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)  # Replace special characters
    text = text.replace('“', '"')  # Replace left double quotation mark
    text = text.replace('”', '"')  # Replace right double quotation mark
    text = text.replace('‘', "'")  # Replace left single quotation mark
    text = text.replace('’', "'")  # Replace right single quotation mark
    text = text.replace('—', '-')  # Replace em dash
    text = text.replace('–', '-')  # Replace en dash
    text = text.replace('\xa0', ' ')  # Remove non-breaking space character
    text = text.replace('&amp;', '&')  # Replace HTML entity for ampersand
    text = text.replace('&nbsp;', ' ')  # Replace HTML entity for non-breaking space
    
    return text

### Check comparison error
def check_comparison (pdfname):
    values_column_a = ["interaction effect", "post-hoc comparison"]
    values_column_b = ["higher", "lower"]
    values_column_c = ["than"]

    file_content = pdfname.read()
        # Initialize the PyMuPDF document
    doc = fitz.open(stream=file_content, filetype="pdf")
        # Initialize a BytesIO object to store the annotated PDF
    output_pdf = io.BytesIO()
    text = ''
    trigger = ''
    found = []
    first_match = None

    for page_num in range(doc.page_count):
        page = doc[page_num]
        text = page.get_text()
        clean_text = clean_pdf(text)
        sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', clean_text)
        for sentence in sentences:
            found_a = any(value in sentence for value in values_column_a)
            found_b = any(value in sentence for value in values_column_b)
            found_c = any(value in sentence for value in values_column_c)
            
            #print(f"Sentence: {sentence}")
            print(f"Found A: {found_a}, Found B: {found_b}, Found C: {found_c}")
        #if found_a and found_b and found_c:
        if found_a and found_b:
            found.append(sentence)
            if first_match is None:
                first_match = page_num + 1
            matched_values = [value for value in values_column_a if value in sentence]
            matched_values += [value for value in values_column_b if value in sentence]
            matched_values += [value for value in values_column_c if value in sentence]
            trigger = matched_values
            print("matches values")
            print(matched_values[:100])
        #text_instances = page.search_for(paragraph)
            #ex = "It has been suggested that a higher liver glycogen concentration stimulates glycogenolysis"
            if sentence in clean_text:
                print("sentence is in clean text")
            if sentence in text:
                print("sentence is in page.get_text()")
            else:
                print("sentence does not match original")
            text_instances = page.search_for(sentence)
            page.add_highlight_annot(text_instances)

    #put rectangle around critical words that where found
            for trigger_str in trigger:
            # Search for the current string in the current page
                stris = doc[page_num].search_for(trigger_str)
                for stri in stris:
                    rect = fitz.Rect(stri)
                    highlight =page.add_rect_annot(rect)
                    highlight.set_colors(stroke=(0, 0, 1)) #blue
                    highlight.update()
    # Save the annotated PDF to the BytesIO object
    doc.save(output_pdf)
    doc.close()
    output_pdf.seek(0)

    # Get the content of the BytesIO object
    annotated_pdf_data = output_pdf.getvalue()
    return annotated_pdf_data, trigger, first_match


### Check alpha error and other related to good practice
def check_alpha (pdfname):
  #Check if pdfname is bytes opect or not
  #This is the case, when pdfname is not the uploaded file, but the changed file (from highlight_sentences)
  if isinstance(pdfname, bytes):
    print("is bytes")
    file_content = io.BytesIO(pdfname)
  else:
    file_content = pdfname.read()
    # Initialize the PyMuPDF document
  doc = fitz.open(stream=file_content, filetype="pdf")
  #check for open data links
  extracted_links = extract_links_from_pdf(doc)
  open_data = check_link_domain(extracted_links)
  # Initialize a BytesIO object to store the annotated PDF
  output_pdf = io.BytesIO()

  target_words = ["effect size", "alpha level", "significance level"]
  unprecise_p = None
  matches = []
  misses = []
  phrases = []
  highlighted_sentences = set()
  first_match = None
  a = None #counter for alpha, to avoid duplicates
  b = None #counter for effect size, to avoid duplicates
  c = None #counter for significance level
  for page_num in range(doc.page_count):
    page = doc[page_num]
    text = page.get_text()
    text_content = clean_pdf(text)
    print(page_num+1)
    #entry = ""

    target_words_lower = [word.lower() for word in target_words]
    text_content_lower = text_content.lower()

    no_effect = target_words_lower[0] not in text_content_lower
    no_alpha = target_words_lower[1] not in text_content_lower
    no_sign = target_words_lower[2] not in text_content_lower
    
    pattern = r'p\s*[<>]'
    #p_match = re.search(r'p\s*[<>]', text, re.IGNORECASE) #the clean text seems to mess up <,>, thats why the uncleaned text is used
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)

    for sentence in sentences:
      entry = ""
      for p_match in re.finditer(pattern, sentence, re.IGNORECASE):
        if p_match:
          unprecise_p = p_match.group()
          entry = entry + '"' + unprecise_p + '" <br>'
          print("Unprecise p-value found on page", page_num + 1, ":", unprecise_p)
          if first_match is None:
            first_match = page_num + 1
          #check if sentence has been highlighted already
      if not entry == "":
        #entry = entry[:-2]
        matches.append(entry) 
        phrases.append(sentence)
        if sentence not in highlighted_sentences:
          text_instances = page.search_for(sentence)
          highlight = page.add_highlight_annot(text_instances)
          highlight.set_colors(stroke=[0.70, 0.80, 1]) #light red highlight
          highlight.update()
          highlighted_sentences.add(sentence)
    else:
      print("No unprecise p-values found.")

    
    if no_alpha and a is None:
      a = 1 #counter to avoid duplicates (since this is redundant information)
      print("Alpha level is missing.")
      misses.insert(0, "No alpha level mentioned") #inserts to beginning of list
    else:
      print("No error (alpha) found.")  
    if no_effect and b is None:
      b = 1 #counter
      print("No effect size mentioned.")
      misses.insert(0, "No effect size mentioned") #inserts to beginning of list
    else:
      print("No error (effect) found.")  
    if no_sign and c is None:
      c = 1 #counter
      print("Significance level is missing.")
      misses.insert(0, "No significance level mentioned") #inserts to beginning of list
    else:
      print("No error (significance) found.")  
     
  print("looking for alpha level")
  print("p matchis")
  print(matches)
  doc.save(output_pdf)
  doc.close()
  output_pdf.seek(0)

    # Get the content of the BytesIO object
  annotated_pdf_data = output_pdf.getvalue()
  print("type highlighted pdf")
  print(type(annotated_pdf_data))
  return annotated_pdf_data, misses, matches, open_data, first_match, phrases


def extract_links_from_pdf(doc):
    #! create list for the found links
    links = []
    # # extract text from PDF
    # with open(pdf_path, 'rb') as file:
    #     pdf_reader = PyPDF2.PdfReader(file)
    
    for page_num in range(doc.page_count):
        page = doc[page_num]
        text = page.get_text()
        #! add all links found in the extracted PDF text to the list of links
        links.extend(re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', text))

    return links

def check_link_domain(extracted_links):
    # define the links that we want to find
    data_sharing_domains = {'osf.io', 're3data.org'}
    # create empty list of links that match these website domains
    shared_data = []
    open_data = ""
    # add link to list if it is found in the paper
    for link in extracted_links:
      parsed_url = urlparse(link)
      if parsed_url.netloc in data_sharing_domains:
        shared_data.append(link)

    # share result based on whether the list is empty or not
    if shared_data:
      print("You have succesfully shared your data! Whoohoo!")
      open_data = "Data is shared according to Open Source Policy"
    else:
      open_data = "We did not find any URLs in your paper that refer to a data sharing website. We recommend to use osf.io or re3data.org to make your data available, or specify the ethical or legal reasons for not doing so."
    return open_data


### Server Side

select_alpha = False
select_marginally = False
#select_link = False
#select_bold = False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    #highlighted_pdf_data = found_words = first_match = None
    file = request.files['file']
    select_marginally = 'select_marginally' in request.form
    select_alpha = 'select_alpha' in request.form
    open = ""
    recom = ""
    if select_marginally and not select_alpha:
      highlighted_pdf_data, found_words, first_match, phrases = highlight_sentences(file, target_words)
      return render_template('result_pdf.html', 
      base64_pdf=base64.b64encode(highlighted_pdf_data).decode('utf-8'),
      found=found_words,
      found_m=found_words,
      first_match=first_match,
      phrase_m=phrases)
    #highlighted_pdf_data, found_words, first_match = check_comparison(file)
    elif select_alpha and not select_marginally:
      highlighted_pdf_data, missing, found_words, open_data, first_match, phrases = check_alpha(file)
      found = missing + found_words
      if open_data is not None:
        open = "No URL to publicy shared data found"
        recom = "We recommend to use osf.io or re3data.org to make your data available or to specify the ethical or legal reasons for not doing so."
      return render_template('result_pdf.html', 
      base64_pdf=base64.b64encode(highlighted_pdf_data).decode('utf-8'),
      found=found, missing=missing,
      found_a=found_words,
      open=open,
      recom=recom,
      first_match=first_match,
      phrase_a=phrases)
    elif select_alpha and select_marginally:
      highlighted_pdf_d, found_words, first_match, phrases = highlight_sentences(file, target_words)
      if first_match is not None:
        highlighted_pdf, missing, found_wordsi, open_data, first_matchi, phrasi = check_alpha(highlighted_pdf_d)
      else:
        highlighted_pdf, missing, found_wordsi, open_data, first_matchi, phrasi = check_alpha(file)
      found_total = found_words + missing + found_wordsi
      if first_match is not None:
        if first_matchi is not None:
          if first_match <= first_matchi:
            # table_data = [
            #   {'column1': 'Data 1, Row 1', 'column2': 'Data 2, Row 1'},
            #   {'column1': 'Data 1, Row 2', 'column2': 'Data 2, Row 2'},
            # ]
            if open_data is not None:
              open = "No URL to publicy shared data found"
              recom = "We recommend to use osf.io or re3data.org to make your data available or to specify the ethical or legal reasons for not doing so."
            return render_template('result_pdf.html', 
            base64_pdf=base64.b64encode(highlighted_pdf).decode('utf-8'),
            found=found_total,
            missing=missing,
            found_m=found_words,
            found_a=found_wordsi,
            open=open,
            recom=recom,
            first_match=first_match,
            phrase_m=phrases,
            phrase_a=phrasi)
          elif first_match > first_matchi:
            if open_data is not None:
              open = "No URL to publicy shared data found"
              recom = "We recommend to use osf.io or re3data.org to make your data available or to specify the ethical or legal reasons for not doing so."
            return render_template('result_pdf.html',
            base64_pdf=base64.b64encode(highlighted_pdf).decode('utf-8'),
            found=found_total,
            missing=missing,
            found_m=found_words,
            found_a=found_wordsi,
            open=open,
            recom=recom,
            first_match=first_matchi,
            phrase_m=phrases,
            phrase_a=phrasi)
        elif open_data is not None:
          open = "No URL to publicy shared data found"
          recom = "We recommend to use osf.io or re3data.org to make your data available or to specify the ethical or legal reasons for not doing so."
          return render_template('result_pdf.html', 
          base64_pdf=base64.b64encode(highlighted_pdf_d).decode('utf-8'),
          found=found_total,
          missing=missing,
          found_m=found_words,
          found_a=found_wordsi,
          open=open,
          recom=recom,
          first_match=first_match,
          phrase_m=phrases,
          phrase_a=phrasi) 
        else:
          return render_template('result_pdf.html', 
          base64_pdf=base64.b64encode(highlighted_pdf_d).decode('utf-8'),
          found=found_total,
          found_m=found_words,
          first_match=first_match,
          phrase_m=phrases)  
      else: 
        if open_data is not None:
              open = "No URL to publicy shared data found"
              recom = "We recommend to use osf.io or re3data.org to make your data available or to specify the ethical or legal reasons for not doing so."
        return render_template('result_pdf.html', 
        base64_pdf=base64.b64encode(highlighted_pdf).decode('utf-8'),
        found=found_total,
        missing=missing,
        found_m=found_wordsi,
        open=open_data,
        first_match=first_matchi,
        phrases_m=phrases)
    #return for highlight_sentences, check_comparison
    
    #return for check_alpha
    #return render_template('result_pdf.html', 
    #base64_pdf=base64.b64encode(highlighted_pdf_data).decode('utf-8'), found=found_words, open=open_data, first_match=first_match)

if __name__ == '__main__':
    app.run(debug=True)


##