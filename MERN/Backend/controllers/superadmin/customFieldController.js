const { getMasterPool } = require('../../config/masterDb');

// Fetch registered custom fields for a specific form (e.g. 'add_hospital')
exports.getCustomFieldsByForm = async (req, res) => {
  try {
    const { formName } = req.params;
    const masterPool = getMasterPool();
    const [rows] = await masterPool.query(
      "SELECT * FROM custom_fields_config WHERE form_name = ? ORDER BY created_at ASC",
      [formName]
    );

    // Parse options_json and file_config_json
    const fields = rows.map(field => ({
      ...field,
      is_required: Boolean(field.is_required),
      options: field.options_json ? (typeof field.options_json === 'string' ? JSON.parse(field.options_json) : field.options_json) : [],
      file_config: field.file_config_json ? (typeof field.file_config_json === 'string' ? JSON.parse(field.file_config_json) : field.file_config_json) : null
    }));

    res.json(fields);
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    res.status(500).json({ error: "Failed to fetch custom fields." });
  }
};

// Create / Register a new custom field for a form
exports.createCustomField = async (req, res) => {
  try {
    const { formName, fieldLabel, fieldType, isRequired, options, fileConfig } = req.body;

    if (!formName || !fieldLabel || !fieldType) {
      return res.status(400).json({ error: "Form name, field label, and field type are required." });
    }

    // Generate unique slug for field_name
    const slug = fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fieldName = `cf_${slug}_${Date.now().toString().slice(-4)}`;

    const optionsJson = options && Array.isArray(options) ? JSON.stringify(options) : null;
    const fileConfigJson = fileConfig ? JSON.stringify(fileConfig) : null;
    const isReqVal = isRequired ? 1 : 0;

    const masterPool = getMasterPool();
    const [result] = await masterPool.query(
      `INSERT INTO custom_fields_config 
       (form_name, field_name, field_label, field_type, is_required, options_json, file_config_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [formName, fieldName, fieldLabel, fieldType, isReqVal, optionsJson, fileConfigJson]
    );

    res.status(201).json({
      id: result.insertId,
      form_name: formName,
      field_name: fieldName,
      field_label: fieldLabel,
      field_type: fieldType,
      is_required: Boolean(isRequired),
      options: options || [],
      file_config: fileConfig || null
    });
  } catch (error) {
    console.error("Error creating custom field:", error);
    res.status(500).json({ error: error.message || "Failed to create custom field." });
  }
};

// Delete custom field definition
exports.deleteCustomField = async (req, res) => {
  try {
    const { id } = req.params;
    const masterPool = getMasterPool();
    await masterPool.query("DELETE FROM custom_fields_config WHERE id = ?", [id]);
    res.json({ success: true, message: "Custom field deleted." });
  } catch (error) {
    console.error("Error deleting custom field:", error);
    res.status(500).json({ error: "Failed to delete custom field." });
  }
};
