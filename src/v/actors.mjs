/**
 * @fileOverview  View code of UI for managing Actor data
 * @author Gerd Wagner
 * @copyright Copyright 2013-2021 Gerd Wagner, Chair of Internet Technology, Brandenburg University of Technology, Germany.
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is",
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */
/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import Actor from "../m/Actor.mjs";
import Person from "../m/Person.mjs";
import { fillSelectWithOptions } from "../../lib/util.mjs";
import Director from "../m/Director.mjs";

/***************************************************************
 Load data
 ***************************************************************/
Person.retrieveAll(); // i will need people for agent and since actors are already in the people I can just load them from there

/***************************************************************
 Set up general, use-case-independent UI elements
 ***************************************************************/
// set up back-to-menu buttons for all use cases
for (const btn of document.querySelectorAll("button.back-to-menu")) {
  btn.addEventListener("click", refreshManageDataUI);
}
// neutralize the submit event for all use cases
for (const frm of document.querySelectorAll("section > form")) {
  frm.addEventListener("submit", function (e) {
    e.preventDefault();
    frm.reset();
  });
}
// save data when leaving the page
window.addEventListener("beforeunload", function () {
  Actor.saveAll();
});

/**********************************************
 * Use case Retrieve/List Actors
 **********************************************/
document
  .getElementById("RetrieveAndListAll")
  .addEventListener("click", function () {
    const tableBodyEl = document.querySelector(
      "section#Actor-R > table > tbody"
    );
    // reset view table (drop its previous contents)
    tableBodyEl.innerHTML = "";
    // populate view table
    for (const key of Object.keys(Actor.instances)) {
      const actor = Actor.instances[key];
      const row = tableBodyEl.insertRow();
      row.insertCell().textContent = actor.personId;
      row.insertCell().textContent = actor.name;
      row.insertCell().textContent = actor.agent;
    }
    document.getElementById("Actor-M").style.display = "none";
    document.getElementById("Actor-R").style.display = "block";
  });

/**********************************************
 * Use case Create Actor
 **********************************************/
const createFormEl = document.querySelector("section#Actor-C > form"),
  selectAgentEl = createFormEl["selectAgent"];
fillSelectWithOptions(selectAgentEl, Person.instances, "personId", {
  displayProp: "name",
});
//----- set up event handler for menu item "Create" -----------
document.getElementById("Create").addEventListener("click", function () {
  document.getElementById("Actor-M").style.display = "none";
  document.getElementById("Actor-C").style.display = "block";
  createFormEl.reset();
});
// set up event handlers for responsive constraint validation
createFormEl.personId.addEventListener("input", function () {
  createFormEl.personId.setCustomValidity(
    Person.checkPersonIdAsId(createFormEl.personId.value, Actor).message
  );
});
createFormEl.name.setCustomValidity(
  Person.checkName(createFormEl.name.value).message
);

/**
 * handle save events
 */
createFormEl["commit"].addEventListener("click", function () {
  const slots = {
    personId: createFormEl.personId.value,
    name: createFormEl.name.value,
    agentId: createFormEl["selectAgent"].value,
  };
  // check all input fields and show error messages
  createFormEl.personId.setCustomValidity(
    Person.checkPersonIdAsId(slots.personId).message,
    Actor
  );
  createFormEl.name.setCustomValidity(
    Person.checkName(createFormEl.name.value).message
  );
  if (createFormEl.checkValidity()) Actor.add(slots);
});

/**********************************************
 * Use case Update Actor
 **********************************************/
const updateFormEl = document.querySelector("section#Actor-U > form");
const updSelActorEl = updateFormEl.selectActor;
const updatedselectAgentEl = updateFormEl["selectAgent"];
// handle click event for the menu item "Update"
document.getElementById("Update").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  updSelActorEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions(updSelActorEl, Actor.instances, "personId", {
    displayProp: "name",
  });
  document.getElementById("Actor-M").style.display = "none";
  document.getElementById("Actor-U").style.display = "block";
  updateFormEl.reset();
});

fillSelectWithOptions(updatedselectAgentEl, Person.instances, "personId", {
  displayProp: "name",
});
// handle change events on actor select element
updSelActorEl.addEventListener("change", handleActorSelectChangeEvent);

// handle Save button click events
updateFormEl["commit"].addEventListener("click", function () {
  const actorIdRef = updSelActorEl.value;
  if (!actorIdRef) return;
  const slots = {
    personId: updateFormEl.personId.value,
    name: updateFormEl.name.value,
    agentId: updateFormEl["selectActor"].value,
  };
  // check all property constraints
  createFormEl.name.setCustomValidity(
    Person.checkName(createFormEl.name.value).message
  );
  // save the input data only if all of the form fields are valid
  if (updSelActorEl.checkValidity()) {
    Actor.update(slots);
    // update the Actor selection list's option element
    updSelActorEl.options[updSelActorEl.selectedIndex].text = slots.name;
  }
});
/**
 * handle Actor selection events
 * when a Actor is selected, populate the form with the data of the selected Actor
 */
function handleActorSelectChangeEvent() {
  const key = updSelActorEl.value;
  if (key) {
    const act = Actor.instances[key];
    updateFormEl.personId.value = act.personId;
    updateFormEl.name.value = act.name;
    createFormEl["selectAgent"].value = act.agentId;
  } else {
    updateFormEl.reset();
  }
}

/**********************************************
 * Use case Delete Actor
 **********************************************/
const deleteFormEl = document.querySelector("section#Actor-D > form");
const delSelActorEl = deleteFormEl.selectActor;
//----- set up event handler for Update button -------------------------
document.getElementById("Delete").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  delSelActorEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions(delSelActorEl, Actor.instances, "personId", {
    displayProp: "name",
  });
  document.getElementById("Actor-M").style.display = "none";
  document.getElementById("Actor-D").style.display = "block";
  deleteFormEl.reset();
});
// handle Delete button click events
deleteFormEl["commit"].addEventListener("click", function () {
  const personIdRef = delSelActorEl.value;
  if (!personIdRef) return;
  if (confirm("Do you really want to delete this Actor?")) {
    Actor.destroy(personIdRef);
    delSelActorEl.remove(delSelActorEl.selectedIndex);
  }
});

/**********************************************
 * Refresh the Manage Actors Data UI
 **********************************************/
function refreshManageDataUI() {
  // show the manage Actor UI and hide the other UIs
  document.getElementById("Actor-M").style.display = "block";
  document.getElementById("Actor-R").style.display = "none";
  document.getElementById("Actor-C").style.display = "none";
  document.getElementById("Actor-U").style.display = "none";
  document.getElementById("Actor-D").style.display = "none";
}

// Set up Manage Actor UI
refreshManageDataUI();
