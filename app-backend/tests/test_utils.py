import pytest
from utils import extract_text_from_file, trim_conversation_history

@pytest.mark.asyncio
async def test_unsupported_file_format():
    """Test that passing an unsupported extension returns the fallback message."""
    content = b"fake bytes"
    result = await extract_text_from_file(content, "test.txt")
    assert result == "Unsupported file format."

@pytest.mark.asyncio
async def test_extract_pdf_text(mocker):
    """Test PDF extraction by mocking pypdf.PdfReader."""
    # 1. Intercept the PdfReader class
    mock_pdf_class = mocker.patch("utils.PdfReader")
    
    # 2. Create a fake page that returns specific text
    mock_page = mocker.Mock()
    mock_page.extract_text.return_value = "Mocked PDF Content"
    
    # 3. Assign the fake page to the mocked reader
    mock_pdf_class.return_value.pages = [mock_page]
    
    # 4. Run the function
    result = await extract_text_from_file(b"fake_pdf_bytes", "document.pdf")
    
    # 5. Assert the logic successfully compiled the text
    assert "Mocked PDF Content" in result

@pytest.mark.asyncio
async def test_extract_docx_text(mocker):
    """Test Word document extraction by mocking docx.Document."""
    mock_doc_class = mocker.patch("utils.Document")
    
    mock_para = mocker.Mock()
    mock_para.text = "Mocked DOCX Content"
    mock_doc_class.return_value.paragraphs = [mock_para]
    
    result = await extract_text_from_file(b"fake_docx_bytes", "document.docx")
    assert "Mocked DOCX Content" in result

@pytest.mark.asyncio
async def test_extract_xlsx_text(mocker):
    """Test Excel extraction by mocking openpyxl.load_workbook."""
    mock_wb_class = mocker.patch("utils.openpyxl.load_workbook")
    
    # Create a fake sheet that returns a single row with two columns
    mock_sheet = mocker.Mock()
    mock_sheet.iter_rows.return_value = [("Row1Col1", "Row1Col2")]
    mock_wb_class.return_value.worksheets = [mock_sheet]
    
    result = await extract_text_from_file(b"fake_xlsx_bytes", "spreadsheet.xlsx")
    assert "Row1Col1 Row1Col2" in result

def test_trim_conversation_history():
    messages = [
        {"role": "user", "content": "word " * 2000}, 
        {"role": "assistant", "content": "middle " * 1000},
        {"role": "user", "content": "recent " * 1000}
    ]
    
    # Budget 1500 words. Should drop the first message completely.
    trimmed = trim_conversation_history(messages, max_words=1500)
    
    assert len(trimmed) == 2
    assert "recent" in trimmed[-1]["content"]
    assert "middle" in trimmed[0]["content"]
    
def test_trim_conversation_truncates_last_resort():
    messages = [{"role": "user", "content": "word " * 3000}]
    trimmed = trim_conversation_history(messages, max_words=1000)
    
    assert len(trimmed) == 1
    assert len(trimmed[0]["content"].split()) == 1002 # 1000 words + "... [Truncated]"