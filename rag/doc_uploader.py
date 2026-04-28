import os
import re
from rag.rag_system import RAGSystem
from rag.doc_processing import process_and_store_document

def sanitize_index_name(name):
    """
    Cleans the string to be a valid Elasticsearch index name.
    - lowercase only
    - cannot include \, /, *, ?, ", <, >, |, spaces, commas, #, :
    """
    name = name.lower()
    # Replace invalid characters with an underscore
    name = re.sub(r'[\s\\/*?"<>|,#:]+', '_', name)
    # Remove leading characters that are invalid at the start
    name = re.sub(r'^[-_+]+', '', name)
    return name

def upload_file(file_path,index_name):
    """
    Uploads a single file to its own Elasticsearch index based on its filename.
    """
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return False
        
    filename = os.path.basename(file_path)
    base_name = os.path.splitext(filename)[0]
    
    # Create a collection (index) name based on the file name
    
    
    if not index_name:
        print(f"Skipping {filename}: Could not generate a valid index name.")
        return False
        
    print(f"\n{'-'*40}")
    print(f"Processing File: {file_path}")
    print(f"Target Collection (Index): {index_name}")
    print(f"{'-'*40}")
    
    try:
        # Initialize RAGSystem with the specific index name
        rag = RAGSystem(index_name=index_name)
        
        # Process and store the document
        success = process_and_store_document(file_path, rag_system=rag)
        if success:
            print(f"Successfully uploaded {filename} to collection '{index_name}'")
            return True
        else:
            print(f"Failed to upload {filename}")
            return False
    except Exception as e:
        print(f"An error occurred while uploading {filename}: {str(e)}")
        return False

def upload_directory(directory_path):
    """
    Finds all supported documents in the directory and stores each in its own Elasticsearch index.
    """
    if not os.path.exists(directory_path):
        print(f"Directory not found: {directory_path}")
        return

    supported_extensions = {'.pdf', '.docx', '.pptx', '.txt'}
    
    for filename in os.listdir(directory_path):
        ext = os.path.splitext(filename)[1].lower()
        if ext in supported_extensions:
            # We skip requirements.txt as it's not a document
            if filename == "requirements.txt":
                continue
                
            file_path = os.path.join(directory_path, filename)
            upload_file(file_path)

if __name__ == "__main__":
    # Example 1: Upload a single file
    # file_to_upload = r"e:\ragworksProject\bajaj_life.txt"
    # upload_file(file_to_upload)
    
    # Example 2: Batch upload an entire directory
    target_directory = r"Health Insurance Research bajaj.pdf"
    print(f"Starting batch upload from directory: {target_directory}")
    upload_file(target_directory,"bajaj_health_insurance")
    target_directory = r"Health Insurance Research icici.pdf"
    print(f"Starting batch upload from directory: {target_directory}")
    upload_file(target_directory,"icici_health_insurance")
    target_directory = r"Health Insurance Research star.pdf"
    print(f"Starting batch upload from directory: {target_directory}")
    upload_file(target_directory,"star_health_insurance")
    target_directory = r"Life Insurance Research.pdf"
    print(f"Starting batch upload from directory: {target_directory}")
    upload_file(target_directory,"bajaj_life_insurance")
    target_directory = r"moto insurance icici.pdf"
    print(f"Starting batch upload from directory: {target_directory}")
    upload_file(target_directory,"icici_moto_insurance")
    target_directory = r"Motor Insurance Research.pdf"
    print(f"Starting batch upload from directory: {target_directory}")
    upload_file(target_directory,"bajaj_moto_insurance")
