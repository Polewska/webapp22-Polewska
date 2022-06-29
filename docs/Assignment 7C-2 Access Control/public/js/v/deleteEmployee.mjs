/**
 * @fileOverview  View methods for the use case "delete book"
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
const formEl = document.forms["Employee"],
    deleteButton = formEl["commit"],
    selectEmployeeEl = formEl["selectEmployee"];

/***************************************************************
 Set up select element
 ***************************************************************/
for (const employeeRec of employeeRecords) {
  const optionEl = document.createElement("option");
  optionEl.text = employeeRec.firstName + " " + employeeRec.lastName;
  optionEl.value = employeeRec.employeeId;
  selectEmployeeEl.add( optionEl, null);
}

/******************************************************************
 Add event listeners for the delete/submit button
 ******************************************************************/
// set an event handler for the delete button
deleteButton.addEventListener("click", async function () {
  const employeeId = selectEmployeeEl.value;
  if (!employeeId) return;
  if (confirm("Do you really want to delete this employee record?")) {
    await Employee.destroy( employeeId);
    // remove deleted employee from select options
    selectEmployeeEl.remove( selectEmployeeEl.selectedIndex);
  }
});