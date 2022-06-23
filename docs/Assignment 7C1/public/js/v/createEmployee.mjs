/**
 * @fileOverview  View methods for the use case "create employee"
 * @author Gerd Wagner
 * @author Juan-Francisco Reyes
 */
/***************************************************************
 Import classes and data types
 ***************************************************************/
import Employee from "../m/Employee.mjs";

/***************************************************************
 Declare variables for accessing UI elements
 ***************************************************************/
const formEl = document.forms["Employee"],
  createButton = formEl["commit"];

/******************************************************************
 Add event listeners for the create/submit button
 ******************************************************************/
createButton.addEventListener("click", async function () {
  const slots = {
    employeeId: formEl["employeeId"].value,
    firstName: formEl["firstName"].value,
    lastName: formEl["lastName"].value,
    birthdate: formEl["birthdate"].value
  };
  await Employee.add( slots);
  formEl.reset();
});
