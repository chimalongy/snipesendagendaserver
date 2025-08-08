import pool from "./database/postgresdb.js";

async function UploadSendingResult(uploaddata) {
 console.log("UPLOADING SENDING RESULT  :", uploaddata)

  const query = `
    INSERT INTO task_results (
      user_id,
      outbound_id,
      task_id,
      sent_from,
      receiver,
      message_id,
      send_result,
      send_time,
      task_name
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const {
    user_id,
    outbound_id,
    task_id,
    task_name,
    sent_from,
    receiver,
    message_id,
    send_result,
    send_time, // Optional: can default to now if not provided
  } = uploaddata;

  try {
    const client = await pool.connect();
    const result = await client.query(query, [
      user_id,
      outbound_id,
      task_id,
      sent_from,
      receiver,
      message_id,
      send_result,
      send_time || new Date(), // fallback to current time
      task_name

    ]);
    client.release();

    console.log("✅ Task result uploaded:", result.rows[0]);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error("❌ Error uploading task result:", error.message);
    return { success: false, error: error.message };
  }
}

export default UploadSendingResult;
