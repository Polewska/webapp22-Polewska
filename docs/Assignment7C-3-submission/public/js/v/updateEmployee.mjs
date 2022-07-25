/**
 * @fileOverview  View methods for the use case "update employee"
 * @author Gerd Wagner
 * @author Juan-Francisco Reyes
 */
/***************************************************************
 Import classes, data types and utility procedures
 ***************************************************************/
import { handleAuthentication } from "./accessControl.mjs";
import Employee, { GenderEL, TherapyEL} from "../m/Employee.mjs";
import { fillSelectWithOptions, createChoiceWidget } from "../../lib/util.mjs";

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
  updateButton = formEl["commit"],
  selectEmployeeEl = formEl["selectEmployee"],
  genderFieldsetEl = formEl.querySelector("fieldset[data-bind='gender']"),
  therapiesFieldsetEl = formEl.querySelector("fieldset[data-bind='therapies']");

/***************************************************************
 Declare variable to cancel record changes listener, DB-UI sync
 ***************************************************************/
let cancelListener = null;

/***************************************************************
 Set up (choice) widgets
 ***************************************************************/
// set up the employee selection list
fillSelectWithOptions( selectEmployeeEl, employeeRecords,
    {valueProp:"employeeId", displayProp:"firstName", displayProp2: "lastName"});
// when an employee is selected, populate the form with its data
selectEmployeeEl.addEventListener("change", async function () {
  const employeeKey = selectEmployeeEl.value;
  if (employeeKey) {
    // retrieve up-to-date employee record
    const employee = await Employee.retrieve( employeeKey);
    formEl["employeeId"].value = employee.employeeId;
    formEl["firstName"].value = employee.firstName;
    formEl["lastName"].value = employee.lastName;
    formEl["birthdate"].valueAsDate = employee.birthdate;

    // set up the gender radio button group
    createChoiceWidget( genderFieldsetEl, "gender",
      [employee.gender], "radio", GenderEL.labels);

    // set up the therapies checkbox group
    createChoiceWidget( therapiesFieldsetEl, "therapies",
      employee.therapySkills, "checkbox", TherapyEL.labels);
    /** Setup listener on the selected employee record synchronising DB with UI **/
    // cancel record listener if a previous listener exists
    if (cancelListener) cancelListener();
    // add listener to selected employee, returning the function to cancel listener
    cancelListener = await Employee.observeChanges( employeeKey);
  } else {
    formEl.reset();
  }
});

/***************************************************************
 Add event listeners for responsive validation
 ***************************************************************/
formEl["firstName"].addEventListener("input", function () {
  formEl["firstName"].setCustomValidity(
    Employee.checkFirstName( formEl["firstName"].value).message);
});
formEl["lastName"].addEventListener("input", function () {
  this.setCustomValidity(
      Employee.checkLastName( this.value).message);
});
formEl["birthdate"].addEventListener("input", function () {
  this.setCustomValidity(
      Employee.checkBirthdate( this.value).message);
});

// mandatory value check
genderFieldsetEl.addEventListener("click", function () {
  formEl["gender"][0].setCustomValidity(
    (!genderFieldsetEl.getAttribute("data-value")) ?
      "A gender must be selected!":"" );
});

/********************************************************************
 Add further event listeners, especially for the update/submit button
 ********************************************************************/
updateButton.addEventListener("click", function () {
  const formEl = document.forms["Employee"],
    selectEmployeeEl = formEl["selectEmployee"],
    employeeIdRef = selectEmployeeEl.value;
  if (!employeeIdRef) return;
  const slots = {
    employeeId: formEl["employeeId"].value,
    firstName: formEl["firstName"].value,
    lastName: formEl["lastName"].value,
    birthdate: formEl["birthdate"].value,

    gender: genderFieldsetEl.getAttribute("data-value"),
    therapySkills: JSON.parse( therapiesFieldsetEl.getAttribute("data-value"))
  };


  // set error messages in case of constraint violations
  formEl["firstName"].setCustomValidity( Employee.checkFirstName( slots.firstName).message);
  formEl["lastName"].setCustomValidity( Employee.checkLastName( slots.lastName).message);
  formEl["birthdate"].setCustomValidity( Employee.checkBirthdate( slots.birthdate).message);

  // set the error message for gender constraint violations on the first radio button
  formEl["gender"][0].setCustomValidity( Employee.checkGender( slots.gender).message);

  // set the error message for therapySkills constraint violations on the first checkbox
  formEl["therapies"][0].setCustomValidity( Employee.checkTherapySkills( slots.therapySkills).message);
  if (formEl.checkValidity()) {
    // cancel DB-UI sync listener
    if (cancelListener) cancelListener();
    Employee.update( slots);
    // update the selection list option
    selectEmployeeEl.options[selectEmployeeEl.selectedIndex].text = slots.firstName + slots.lastName;
    formEl.reset();
  }
});
// neutralize the submit event
formEl.addEventListener( "submit", function (e) {
  e.preventDefault();
});
// set event to cancel DB listener when the browser window/tab is closed
window.addEventListener("beforeunload", function () {
  if (cancelListener) cancelListener();
});
