/**
 * @fileOverview  View methods for the use case "create employee"
 * @author Gerd Wagner
 * @author Juan-Francisco Reyes
 */
/***************************************************************
 Import classes, data types and utility procedures
 ***************************************************************/
import { handleAuthentication } from "./accessControl.mjs";
import Employee, { GenderEL, TherapyEL} from "../m/Employee.mjs";
import { createChoiceWidget, showProgressBar, hideProgressBar }
  from "../../lib/util.mjs";

/***************************************************************
 Setup and handle UI Authentication
 ***************************************************************/
handleAuthentication();

/***************************************************************
 Declare variables for accessing UI elements
 ***************************************************************/
const formEl = document.forms["Employee"],
  createButton = formEl["commit"],
  genderFieldsetEl = formEl.querySelector("fieldset[data-bind='gender']"),
  therapiesFieldsetEl = formEl.querySelector("fieldset[data-bind='therapies']"),
  progressEl = document.querySelector("progress");

/***************************************************************
 Set up (choice) widgets
 ***************************************************************/
// set up the gender radio button group
createChoiceWidget( genderFieldsetEl, "gender", [],
  "radio", GenderEL.labels, true);
// set up the therapies checkbox group
createChoiceWidget( therapiesFieldsetEl, "therapies", [],
  "checkbox", TherapyEL.labels);

/***************************************************************
 Add event listeners for responsive validation
 ***************************************************************/
// add event listeners for responsive validation on selection lists
formEl["employeeId"].addEventListener("input", function () {
  formEl["employeeId"].setCustomValidity( Employee.checkEmployeeId( formEl["employeeId"].value).message);
});
formEl["firstName"].addEventListener("input", function () {
  formEl["firstName"].setCustomValidity( Employee.checkFirstName( formEl["firstName"].value).message);
});
formEl["lastName"].addEventListener("input", function () {
  formEl["lastName"].setCustomValidity( Employee.checkLastName( formEl["lastName"].value).message);
});
formEl["birthdate"].addEventListener("input", function () {
  formEl["birthdate"].setCustomValidity( Employee.checkBirthdate( formEl["birthdate"].value).message);
})
// mandatory value check constraint for radio button group
genderFieldsetEl.addEventListener("click", function () {
  formEl["gender"][0].setCustomValidity(
    (!genderFieldsetEl.getAttribute("data-value")) ?
      "A gender must be selected!":"" );
});
// no mandatory value check constraint for checkbox group therapies as this is an optional property ([0..*])

/********************************************************************
 Add further event listeners, especially for the create/submit button
 ********************************************************************/
createButton.addEventListener("click", async function () {
  const slots = { employeeId: formEl["employeeId"].value,
    firstName: formEl["firstName"].value,
    lastName: formEl["lastName"].value,
    birthdate: formEl["birthdate"].value,
    gender: genderFieldsetEl.getAttribute("data-value"),
    therapySkills: JSON.parse( therapiesFieldsetEl.getAttribute("data-value"))
  };

  // set error messages in case of constraint violations
  showProgressBar( progressEl);
  formEl["employeeId"].setCustomValidity(( await Employee.checkEmployeeIdAsId(slots.employeeId)).message);
  formEl["firstName"].setCustomValidity( Employee.checkFirstName( slots.firstName).message);
  formEl["lastName"].setCustomValidity( Employee.checkLastName( slots.lastName).message);
  formEl["birthdate"].setCustomValidity( Employee.checkBirthdate( slots.birthdate).message);

  formEl["gender"][0].setCustomValidity( Employee.checkGender( slots.gender).message);

  formEl["therapies"][0].setCustomValidity( Employee.checkTherapySkills( slots.therapySkills).message);

  if (formEl.checkValidity()) {
    await Employee.add( slots);
    formEl.reset();
  }
  hideProgressBar( progressEl);
});
// neutralize the submit event
formEl.addEventListener( "submit", function (e) {
  e.preventDefault();
});
