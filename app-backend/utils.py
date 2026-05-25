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

def trim_conversation_history(messages: list, max_words: int = 2000) -> list:
    """
    Trims the conversation history to fit within a specific word budget.
    Walks backward from the most recent messages to preserve immediate context.
    """
    trimmed_messages = []
    current_word_count = 0

    # Walk backwards (most recent first)
    for msg in reversed(messages):
        content = msg.get("content", "")
        words = content.split()
        word_count = len(words)

        if current_word_count + word_count > max_words:
            # Fill whatever budget is remaining before breaking
            remaining_budget = max_words - current_word_count
            if remaining_budget > 0:
                # Notice the space before "... [Truncated]" to ensure word counts match exactly
                truncated_content = " ".join(words[:remaining_budget]) + " ... [Truncated]"
                trimmed_messages.append({"role": msg.get("role", "user"), "content": truncated_content})
            break

        trimmed_messages.append(msg)
        current_word_count += word_count

    # Reverse back to chronological order
    return list(reversed(trimmed_messages))