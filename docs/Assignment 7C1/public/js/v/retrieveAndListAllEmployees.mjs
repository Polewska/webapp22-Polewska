/**
 * @fileOverview  View methods for the use case "retrieve and list books"
 * @author Gerd Wagner
 * @author Juan-Francisco Reyes
 */
/***************************************************************
 Import classes and data types
 ***************************************************************/
import Employee from "../m/Employee.mjs";

/***************************************************************
 Load data
 ***************************************************************/
const employeeRecords = await Employee.retrieveAll();

/***************************************************************
 Declare variables for accessing UI elements
 ***************************************************************/
const tableBodyEl = document.querySelector("table#employees>tbody");

/***************************************************************
 Render list of all employee records
 ***************************************************************/
// for each employee, create a table row with a cell for each attribute
for (const employeeRec of employeeRecords) {
  const row = tableBodyEl.insertRow();
  row.insertCell().textContent = employeeRec.employeeId;
  row.insertCell().textContent = employeeRec.firstName;
  row.insertCell().textContent = employeeRec.lastName;
  row.insertCell().textContent = employeeRec.birthdate.toDate().toLocaleDateString();
}

function formatDate(dateObject){

  const today = dateObject;
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // months are 0-indexed -> add 1
  let dd = today.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  return yyyy + '-' + mm + '-' + dd;
}
