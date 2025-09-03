import fitz  # PyMuPDF
import requests
import json
import sys
import logging
from io import BytesIO
from typing import Dict, Any

# Configure logging for professional and clear output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)

def download_pdf(url: str) -> BytesIO:
    """
    Downloads a PDF file from a given URL.

    Args:
        url (str): The URL of the PDF file.

    Returns:
        BytesIO: A BytesIO object containing the PDF content.
    
    Raises:
        requests.exceptions.RequestException: If the download fails due to network issues.
        ValueError: If the HTTP status code is not 200 OK.
    """
    logging.info(f"Starting download of PDF from URL: {url}")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        
        # Check if the content type is indeed a PDF
        if 'application/pdf' not in response.headers.get('Content-Type', ''):
            logging.warning("URL content-type is not application/pdf. Proceeding anyway.")
            
        logging.info("PDF downloaded successfully.")
        return BytesIO(response.content)
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to download PDF: {e}")
        raise

def convert_pdf_to_text(pdf_bytes: BytesIO) -> str:
    """
    Extracts text from a PDF file stored in a BytesIO object.

    Args:
        pdf_bytes (BytesIO): The in-memory PDF data.

    Returns:
        str: The extracted text from the PDF.
    
    Raises:
        Exception: If PDF parsing fails.
    """
    text_content = ""
    try:
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        logging.info(f"Opened PDF with {pdf_document.page_count} pages.")
        
        for page_num in range(pdf_document.page_count):
            page = pdf_document.load_page(page_num)
            text_content += page.get_text() # type: ignore  
            
        pdf_document.close()
        logging.info("Successfully extracted text from PDF.")
    except Exception as e:
        logging.error(f"Failed to extract text from PDF: {e}")
        raise
        
    return text_content

def process_resume_url(url: str) -> Dict[str, Any]:
    """
    Orchestrates the resume processing by downloading a PDF and extracting its text.

    Args:
        url (str): The URL of the resume PDF.

    Returns:
        Dict[str, Any]: A dictionary containing the extracted text and status information.
    """
    output_data = {
        "status": "success",
        "extracted_text": "",
        "error_message": None
    }
    
    try:
        pdf_data = download_pdf(url)
        extracted_text = convert_pdf_to_text(pdf_data)
        output_data["extracted_text"] = extracted_text
        logging.info("Resume processing completed successfully.")
    except Exception as e:
        output_data["status"] = "error"
        output_data["error_message"] = str(e)
        logging.error("Resume processing failed.")
        
    return output_data

if __name__ == "__main__":
    # Check for command-line arguments
    if len(sys.argv) < 2:
        logging.error("Usage: python pdf_to_text_service.py <URL_TO_PDF>")
        sys.exit(1)
        
    resume_url = sys.argv[1]
    
    # Process the URL and get the final output
    result = process_resume_url(resume_url)
    
    # Print the result as a JSON string for easy consumption by other applications
    print(json.dumps(result, indent=2))
