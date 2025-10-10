#!/bin/bash

# Test individual application
echo "Testing individual application..."
curl -X POST http://localhost:8000/custom-auth/submit-application/ \
  -F "application_type=individual" \
  -F "ktp=1234567890123456" \
  -v

echo -e "\n\n"

# Test business application with files
echo "Testing business application..."

# Create test PDF files
echo "%PDF-1.4" > /tmp/test_akta.pdf
echo "%PDF-1.4" > /tmp/test_sk.pdf

curl -X POST http://localhost:8000/custom-auth/submit-application/ \
  -F "application_type=business" \
  -F "director_id=6543210987654321" \
  -F "akta=@/tmp/test_akta.pdf" \
  -F "sk_kemenkumham=@/tmp/test_sk.pdf" \
  -v

# Cleanup
rm -f /tmp/test_akta.pdf /tmp/test_sk.pdf

echo -e "\n\nDone!"
