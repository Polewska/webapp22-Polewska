/**
 * @fileOverview  View methods for the use case "delete employee"
 * @author Gerd Wagner
 * @author Juan-Francisco Reyes
 * @copyright Copyright � 2020-2022 Gerd Wagner (Chair of Internet Technology) and Juan-Francisco Reyes,
 * Brandenburg University of Technology, Germany.
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is",
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */
/***************************************************************
 Import classes, data types and utility procedures
 ***************************************************************/
import { handleAuthentication } from "./accessControl.mjs";
import Employee from "../m/Employee.mjs";
import { fillSelectWithOptions } from "../../lib/util.mjs";

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
const formEl = document.forms["Employee"],
  deleteButton = formEl["commit"],
  selectEmployeeEl = formEl["selectEmployee"];

/***************************************************************
 Declare variable to cancel observer, DB-UI sync
 ***************************************************************/
let cancelListener = null;

/***************************************************************
 Set up (choice) widgets
 ***************************************************************/
// set up the employee selection list
fillSelectWithOptions( selectEmployeeEl, employeeRecords,
  {valueProp:"employeeId", displayProp:"firstName", displayProp2: "lastName"});

/*******************************************************************
 Setup listener on the selected employee record synchronising DB with UI
 ******************************************************************/
// set up listener to document changes on selected employee record
selectEmployeeEl.addEventListener("change", async function () {
  const employeeKey = selectEmployeeEl.value;
  if (employeeKey) {
    // cancel record listener if a previous listener exists
    if (cancelListener) cancelListener();
    // add listener to selected employee, returning the function to cancel listener
    cancelListener = await Employee.observeChanges( employeeKey);
  }
});

/********************************************************************
 Add further event listeners, especially for the delete/submit button
 ********************************************************************/
deleteButton.addEventListener("click", function () {
  const employeeIdRef = selectEmployeeEl.value;
  if (!employeeIdRef) return;
  if (confirm("Do you really want to delete this employee record?")) {
    // cancel DB-UI sync listener
    if (cancelListener) cancelListener();
    Employee.destroy( employeeIdRef);
    // remove deleted employee from select options
    selectEmployeeEl.remove( selectEmployeeEl.selectedIndex);
  }
});
// set event to cancel DB listener when the browser window/tab is closed
window.addEventListener("beforeunload", function () {
  if (cancelListener) cancelListener();
});
