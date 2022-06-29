/**
 * @fileOverview  View methods for the use case "retrieve and list books"
 * @authors Gerd Wagner & Juan-Francisco Reyes
 */
/***************************************************************
 Import classes and data types
 ***************************************************************/
import { handleAuthentication } from "./accessControl.mjs";
import Employee from "../m/Employee.mjs";

/***************************************************************
 Setup and handle UI Authentication
 ***************************************************************/
handleAuthentication();

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
