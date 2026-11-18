# Science_Scan
A research project on detecting statistical misinterpretation of non-significant p-values using NLP, adherence to reporting guidelines and open science principles.

1. Dataset creation
   * `NLP Dataset creation Engine` is the code responsible for creating the training dataset. This will need PDFs as input from the folder `pdfs`. The code needs `nonsignificant correct.xlsx` and `nonsignificant incorect.xlsx` as input for phrases to detect.
2. Mock-up website
   * This links to a Figma mock-up of how we would envision functionalities and the appearance of Science Scan
3. NLP
   * Contains the final Python code to train a model `NLPBERT2` and `NLPSCIBERT2`
   * NLP final results contains the final model configurations `BERT model` and `SCIBERT model`. Also PDFs where the training and evaluation can be viewed (`NLP BERT2.pdf` and `NLP SCIBERT2.pdf`)
   * `15-12 Final Training data set.xlsx` is the final labeled dataset used to train the models
4. Website
   * Contains a website that useses several rule-based algorithms to check for non-significant p-values using NLP, adherence to reporting guidelines and open science principles. The website needs a PDF as input to review and mark mistakes or missing elements
   * The Python script `app.py` performs these algorithms and configuring the web application using Flask, a Python microframework for building web applications

4. `NLP tutorial.url`
   * Links to a Google Collab notebook that explains the full NLP training process and would allow you to replicate our results

