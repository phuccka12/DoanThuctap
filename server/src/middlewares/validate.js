const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        errors: result.error.issues.map(i => ({ field: i.path.join("."), message: i.message })),
      });
    }
    req.body = result.data;
    next();
  } catch (e) {
    return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
  }
};

module.exports = validate;
