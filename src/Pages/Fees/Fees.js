import { isStudentViewOnly } from "../../utlls/studentAccess";
import AdminFeesPage from "./AdminFeesPage";
import StudentFinanceLog from "./StudentFinanceLog";

function Fees() {
  if (isStudentViewOnly()) {
    return <StudentFinanceLog />;
  }

  return <AdminFeesPage />;
}

export default Fees;
