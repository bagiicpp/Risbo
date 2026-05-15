import io
from pypdf import PdfReader
from docx import Document
import openpyxl

async def extract_text_from_file(file_content: bytes, filename: str) -> str:
    text = ""
    try:
        if filename.endswith('.pdf'):
            reader = PdfReader(io.BytesIO(file_content))
            for page in reader.pages:
                if page.extract_text():
                    text += page.extract_text() + "\n"
        
        elif filename.endswith('.docx'):
            doc = Document(io.BytesIO(file_content))
            for para in doc.paragraphs:
                text += para.text + "\n"
        
        elif filename.endswith('.xlsx'):
            wb = openpyxl.load_workbook(io.BytesIO(file_content), data_only=True)
            for sheet in wb.worksheets:
                for row in sheet.iter_rows(values_only=True):
                    # Filter out empty cells and join the row into a string
                    row_text = " ".join([str(cell) for cell in row if cell is not None])
                    if row_text:
                        text += row_text + "\n"
        else:
            text = "Unsupported file format."
    except Exception as e:
        text = f"Error extracting text: {str(e)}"
        
    return text