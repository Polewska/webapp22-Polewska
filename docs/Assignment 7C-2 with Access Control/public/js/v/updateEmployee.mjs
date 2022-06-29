/**
 * @fileOverview  View methods for the use case "update employee"
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
    updateButton = formEl["commit"],
    selectEmployeeEl = formEl["selectEmployee"];

/***************************************************************
 Set up select element
 ***************************************************************/
// fill select with options
for (const employeeRec of employeeRecords) {
  const optionEl = document.createElement("option");
  optionEl.value = employeeRec.employeeId;
  optionEl.text = employeeRec.firstName + " " + employeeRec.lastName;

  selectEmployeeEl.add( optionEl, null);
}
// when an employee is selected, fill the form with its data
selectEmployeeEl.addEventListener("change", async function () {
  const employeeId = selectEmployeeEl.value;
  if (employeeId) {
    // retrieve up-to-date employee record
    const employeeRec = await Employee.retrieve( employeeId);
    formEl["employeeId"].value = employeeRec.employeeId;
    formEl["firstName"].value = employeeRec.firstName;
    formEl["lastName"].value = employeeRec.lastName;
    formEl["birthdate"].valueAsDate = employeeRec.birthdate.toDate();
  } else {
    formEl.reset();
  }
});

/******************************************************************
 Add event listeners for the update/submit button
 ******************************************************************/
// set an event handler for the update button
updateButton.addEventListener("click", async function () {
  const slots = {
        employeeId: formEl["employeeId"].value,
        firstName: formEl["firstName"].value,
        lastName: formEl["lastName"].value,
        birthdate: formEl["birthdate"].value
      },
      employeeIdRef = selectEmployeeEl.value;
  if (!employeeIdRef) return;
  await Employee.update( slots);
  // update the selection list option element
  selectEmployeeEl.options[selectEmployeeEl.selectedIndex].text = slots.firstName + slots.lastName;
  formEl.reset();
});
