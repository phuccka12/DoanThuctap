# CSV Import/Export Guide for Vocabulary Bank

## 📥 Import CSV

### Format Requirements

**CSV Header (Required):**
```csv
word,part_of_speech,pronunciation,meaning,example,synonyms,antonyms,imageUrl,audioUrl,level,topics,tags
```

### Field Details

| Field | Required | Type | Description | Example |
|-------|----------|------|-------------|---------|
| `word` | ✅ Yes | string | Từ vựng | `airport` |
| `part_of_speech` | ❌ No | enum | Loại từ: `noun`, `verb`, `adjective`, `adverb`, `pronoun`, `preposition`, `conjunction`, `interjection`, `other` | `noun` |
| `pronunciation` | ❌ No | string | Phiên âm IPA | `/ˈeə.pɔːt/` |
| `meaning` | ✅ Yes | string | Nghĩa tiếng Việt | `Sân bay` |
| `example` | ❌ No | string | Câu ví dụ | `I'm at the airport` |
| `synonyms` | ❌ No | string | Từ đồng nghĩa (phân cách bởi `,`) | `aerodrome, airfield` |
| `antonyms` | ❌ No | string | Từ trái nghĩa (phân cách bởi `,`) | `` |
| `imageUrl` | ❌ No | string | URL hình ảnh | `https://example.com/airport.jpg` |
| `audioUrl` | ❌ No | string | URL file âm thanh | `https://example.com/airport.mp3` |
| `level` | ❌ No | enum | Cấp độ: `beginner`, `intermediate`, `advanced` | `beginner` |
| `topics` | ❌ No | string | Topic IDs (phân cách bởi `\|`) | `60a7f1b2c3d4e5f6a7b8c9d0\|60a7f1b2c3d4e5f6a7b8c9d1` |
| `tags` | ❌ No | string | Tags (phân cách bởi `,`) | `travel, transportation` |

### Important Notes

#### 🔸 Topics Field Format
- **Delimiter**: Use pipe `|` to separate multiple topic IDs
- **Why `|` not `,`?**: Because `synonyms` and `antonyms` already use `,`
- **Example**: `60a7f1b2c3d4e5f6a7b8c9d0|60a7f1b2c3d4e5f6a7b8c9d1`
- **Empty**: Leave blank if no topics
- **Get Topic IDs**: Export existing vocabulary or check database

#### 🔸 Synonyms/Antonyms Format
- **Delimiter**: Use comma `,` to separate multiple words
- **Example**: `aerodrome, airfield, air terminal`

#### 🔸 Tags Format
- **Delimiter**: Use comma `,` to separate multiple tags
- **Example**: `travel, transportation, airport`

### Sample CSV Files

#### Example 1: Basic Vocabulary (No Topics)
```csv
word,part_of_speech,pronunciation,meaning,example,synonyms,antonyms,imageUrl,audioUrl,level,topics,tags
hello,interjection,/həˈləʊ/,Xin chào,Hello everyone!,,,,beginner,,greetings
goodbye,interjection,/ɡʊdˈbaɪ/,Tạm biệt,Goodbye my friend!,bye,hello,,beginner,,greetings
thank you,phrase,/θæŋk juː/,Cảm ơn,Thank you very much,thanks,,,beginner,,polite
```

#### Example 2: Travel Vocabulary (With Topics)
```csv
word,part_of_speech,pronunciation,meaning,example,synonyms,antonyms,imageUrl,audioUrl,level,topics,tags
airport,noun,/ˈeə.pɔːt/,Sân bay,I'm at the airport,aerodrome,,,beginner,60a7f1b2c3d4e5f6a7b8c9d0,travel,transportation
ticket,noun,/ˈtɪk.ɪt/,Vé,I bought a ticket,pass,,,beginner,60a7f1b2c3d4e5f6a7b8c9d0,travel,transportation
passport,noun,/ˈpɑːs.pɔːt/,Hộ chiếu,Where is my passport?,travel document,,,beginner,60a7f1b2c3d4e5f6a7b8c9d0|60a7f1b2c3d4e5f6a7b8c9d1,travel,document
```

### Import Process

1. **Prepare CSV File**
   - Use UTF-8 encoding
   - Follow the format above
   - Ensure required fields (`word`, `meaning`) are filled

2. **Import via Admin Panel**
   - Go to Admin → Vocabulary Bank
   - Click "Import CSV" button
   - Select your CSV file
   - Preview first 5 lines
   - Click "Import"

3. **Validation**
   - System checks for required fields
   - Detects duplicate entries (word + part_of_speech)
   - Shows success/failed count

4. **Results**
   - Success: Vocabulary added to database
   - Failed: Error details shown (missing fields, duplicates, invalid data)

### Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Missing word or meaning" | Required fields empty | Fill in `word` and `meaning` |
| "Duplicate entry" | Word already exists | Update existing or use different word |
| "Invalid level" | Level not in enum | Use: `beginner`, `intermediate`, or `advanced` |
| "Invalid part_of_speech" | POS not in enum | Use valid values (see Field Details) |
| "Invalid topic ID" | Topic doesn't exist | Check topic IDs in database |

---

## 📤 Export CSV

### Export Process

1. **Export via Admin Panel**
   - Go to Admin → Vocabulary Bank
   - Click "Export CSV" button
   - File downloads automatically

2. **Export Format**
   - Same format as import
   - Includes all active vocabularies
   - Topics exported as IDs (pipe-separated)
   - Ready for re-import

### What Gets Exported?

- **All fields**: word, pronunciation, meaning, example, etc.
- **Topics**: As ObjectID strings (e.g., `60a7f1b2c3d4e5f6a7b8c9d0|60a7f1b2c3d4e5f6a7b8c9d1`)
- **Arrays**: Synonyms, antonyms, tags (comma-separated)
- **Only active**: `is_active: true` vocabularies

### Use Cases for Export

1. **Backup**: Save vocabulary database
2. **Edit in Excel**: Bulk edit then re-import
3. **Share**: Send to other admins
4. **Template**: Use as template for new imports

---

## 🔄 Workflow Examples

### Workflow 1: Bulk Import New Vocabulary

```bash
1. Create CSV file with new vocabulary
2. Import via Admin Panel
3. Check results (success/failed)
4. Fix failed entries if needed
5. Re-import failed entries
```

### Workflow 2: Edit Existing Vocabulary in Excel

```bash
1. Export vocabulary to CSV
2. Open in Excel/Google Sheets
3. Make bulk edits
4. Save as CSV (UTF-8)
5. Delete existing vocabulary (if needed)
6. Import updated CSV
```

### Workflow 3: Add Topics to Existing Vocabulary

```bash
1. Export vocabulary to CSV
2. Get Topic IDs from database or export topics
3. Add topic IDs to "topics" column (pipe-separated)
4. Import updated CSV
   - System will update existing entries
   - Or delete old + import new
```

---

## 📝 Best Practices

### ✅ Do's

- Use UTF-8 encoding
- Include header row
- Fill required fields (word, meaning)
- Use correct delimiters (`,` for tags, `|` for topics)
- Test with small sample first
- Export before bulk import (backup)

### ❌ Don'ts

- Don't use Excel native format (.xlsx) - use CSV
- Don't mix delimiters (use `,` for synonyms, `|` for topics)
- Don't leave header row blank
- Don't use special characters in IDs
- Don't import without preview

---

## 🛠 Troubleshooting

### Q: Import shows "0 thành công, 10 thất bại"

**A:** Check:
1. CSV format matches header
2. Required fields filled (word, meaning)
3. UTF-8 encoding
4. No duplicate entries
5. Valid enum values (level, part_of_speech)

### Q: Topics not showing after import

**A:** Check:
1. Topic IDs are correct (use export to get IDs)
2. Topics separated by `|` not `,`
3. Topic IDs exist in database
4. No trailing spaces

### Q: Special characters showing as �

**A:** 
1. Save CSV as UTF-8 encoding
2. Use "CSV UTF-8" option in Excel
3. Or use Google Sheets (auto UTF-8)

---

## 📦 Sample Files

See `/sample_vocabulary_import.csv` in project root for working example.

---

## 🔗 Related Documentation

- [Vocabulary Bank Topic Management](./VOCABULARY_TOPIC_MANAGEMENT.md)
- [Vocabulary Architecture](./VOCABULARY_ARCHITECTURE_DIAGRAM.md)
- [Quick Start Guide](./VOCABULARY_TOPICS_QUICK_START.md)
