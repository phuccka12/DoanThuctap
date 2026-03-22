import json
import re

def parse_json_safely_mock(text, default_value=None):
    if not text: return default_value
    
    try:
        # 1. Clean Markdown
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        text = text.strip()

        # 2. Find first {
        start_idx = text.find('{')
        if start_idx == -1: return default_value
        text_to_parse = text[start_idx:]
        
        # 3. Clean trailing commas
        text_to_parse = re.sub(r',\s*}', '}', text_to_parse)
        text_to_parse = re.sub(r',\s*]', ']', text_to_parse)

        # 4. FIX: Escape control characters INSIDE string literals
        # This regex identifies "..." including escaped quotes
        def escape_inside_quotes(match):
            s = match.group(0)
            # Replace raw newlines, tabs, etc. within the string content
            # (Keeping the outer quotes)
            content = s[1:-1]
            content = content.replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
            return f'"{content}"'

        text_to_parse = re.sub(r'"(?:\\.|[^"\\])*"', escape_inside_quotes, text_to_parse)

        # 5. Decode
        decoder = json.JSONDecoder()
        try:
            obj, _ = decoder.raw_decode(text_to_parse)
            return obj
        except json.JSONDecodeError:
            end_idx = text_to_parse.rfind('}')
            if end_idx != -1:
                return json.loads(text_to_parse[:end_idx+1])
            raise

    except Exception as e:
        print(f"FAILED: {e}")
        return default_value

# TEST CASES
bad_json = """
{
  "critique": "Dòng 1
Dòng 2 với tab\t.",
  "list": ["item 1
  có newline", "item 2"]
}
"""

print("--- TESTING ---")
result = parse_json_safely_mock(bad_json)
if result:
    print("SUCCESS!")
    print(json.dumps(result, indent=2, ensure_ascii=False))
else:
    print("FAILED TO PARSE.")
