/**
 * @fileOverview  View methods for the use case "retrieve and list books"
 * @author Gerd Wagner
 * @author Juan-Francisco Reyes
 */
/***************************************************************
 Import classes, data types and utility procedures
 ***************************************************************/
import { handleAuthentication } from "./accessControl.mjs";
import Employee, { GenderEL, TherapyEL} from "../m/Employee.mjs";
import { showProgressBar, hideProgressBar } from "../../lib/util.mjs";

/***************************************************************
 Setup and handle UI Authentication
 ***************************************************************/
handleAuthentication();

/**********************************************************************
 Declare variables for accessing UI elements
 **********************************************************************/
const selectOrderEl = document.querySelector("main>div>div>label>select");
const tableBodyEl = document.querySelector("table#employees>tbody"),
  progressEl = document.querySelector("progress");

/***************************************************************
 Create table view
 ***************************************************************/
await retrieveAndListAllEmployees();

/***************************************************************
 Handle order selector
 ***************************************************************/
selectOrderEl.addEventListener("change", async function (e) {
  // invoke list with order selected
  await retrieveAndListAllEmployees( e.target.value);
});

/***************************************************************
 Render list of all employee records
 ***************************************************************/
async function retrieveAndListAllEmployees(order) {
  tableBodyEl.innerHTML = "";
  showProgressBar( progressEl);
  // load a list of all employee records
  const employeeRecords = await Employee.retrieveAll( order);
  // for each employee, create a table row with a cell for each attribute
  for (const employeeRec of employeeRecords) {
    const row = tableBodyEl.insertRow();
    row.insertCell().textContent = employeeRec.employeeId;
    row.insertCell().textContent = employeeRec.firstName;
    row.insertCell().textContent = employeeRec.lastName;
    row.insertCell().textContent = employeeRec.birthdate.toLocaleDateString();
    row.insertCell().textContent = GenderEL.labels[employeeRec.gender - 1];

    row.insertCell().textContent = !employeeRec.therapySkills ? "" : TherapyEL.stringify( employeeRec.therapySkills);

  }
  hideProgressBar( progressEl);
}
