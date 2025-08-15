import pool from "./database/postgresdb.js";

const ALLOWED_FIELDS = [
  "email_address",
  "access_token",
  "refresh_token",
  "sender_name",
  "signature",
  "daily_sending_capacity",
  "daily_usage",
  "last_used",
];

export async function updateEmailSettings(user_id, email, field_name, field_value) {
  // Sanitize input
  const sanitizedField = field_name.trim();
  const sanitizedEmail = email.trim().toLowerCase();

  if (!ALLOWED_FIELDS.includes(sanitizedField)) {
    throw new Error(`Invalid field name: ${sanitizedField}`);
  }

  const query = `
    UPDATE email_settings_2
    SET ${sanitizedField} = $1
    WHERE user_id = $2 AND email_address = $3
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [field_value, user_id, sanitizedEmail]);

    if (result.rowCount === 0) {
      console.warn(`⚠ No record found for user_id: ${user_id}, email: ${sanitizedEmail}`);
      return {success:false, data:null};
    }

    console.info(`✅ Updated ${sanitizedField} for ${sanitizedEmail}`);
    return {success:true, data:result.rows[0]};
  } catch (error) {
    console.log("❌ Error updating field:", error);
     return {success:false, data:null};
  }
}
