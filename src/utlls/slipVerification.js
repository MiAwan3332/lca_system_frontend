import axios from "axios";
import { config } from "./config";

export async function issueSlipVerificationQr({
  authToken,
  student_name,
  cnic = "",
  phone = "",
  batch_name = "",
  total_fee = 0,
  amount_received = 0,
  remaining_fee = 0,
  payment_option = "",
  payment_method = "",
  class_time = "",
  authorized_by = "",
  slip_type = "fee",
} = {}) {
  if (!authToken || !String(student_name || "").trim()) {
    return { qrDataUrl: null, verifyUrl: "" };
  }

  try {
    const { data } = await axios.post(
      `${config.BASE_URL}/admission-slips/issue`,
      {
        student_name,
        cnic,
        phone,
        batch_name,
        total_fee,
        amount_received,
        remaining_fee,
        payment_option,
        payment_method,
        class_time,
        authorized_by,
        slip_type,
        verify_base_url: window.location.origin,
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return {
      qrDataUrl: data?.qr_data_url || null,
      verifyUrl: data?.verify_url || "",
    };
  } catch (error) {
    console.warn("Fee slip verification QR unavailable:", error);
    return { qrDataUrl: null, verifyUrl: "" };
  }
}
