const validate = (schema) => (req, res, next) => {
  try {
    // Parse with full request object (body, query, params)
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    
    if (!result.success) {
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        errors: result.error.issues.map(i => ({ 
          field: i.path.join("."), 
          message: i.message 
        })),
      });
    }
    
    // Update request with validated data
    if (result.data.body) req.body = result.data.body;
    if (result.data.query) req.query = result.data.query;
    if (result.data.params) req.params = result.data.params;
    
    next();
  } catch (e) {
    console.error('Validation error:', e);
    return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
  }
};

module.exports = validate;
