import jwt
from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    SECRET_KEY, 
    ALGORITHM
)

def test_password_hashing():
    """Test that passwords hash correctly and verify against the hash."""
    plain_password = "supersecretpassword123"
    hashed = get_password_hash(plain_password)
    
    # Ensure the hash is not just the plain password
    assert hashed != plain_password
    
    # Ensure verification works for the correct password
    assert verify_password(plain_password, hashed) is True
    
    # Ensure verification fails for the wrong password
    assert verify_password("wrongpassword", hashed) is False

def test_create_access_token():
    """Test that a JWT is correctly signed and contains the right claims."""
    data = {"sub": "athlete@example.com"}
    token = create_access_token(data)
    
    # Decode the token to verify its contents
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    
    assert payload["sub"] == "athlete@example.com"
    # Ensure the expiration claim was automatically added
    assert "exp" in payload