/**
 * @fileOverview  View code of UI for managing Movie data
 * @author Gerd Wagner
 */
/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import Person from "../m/Person.mjs";
import Actor from "../m/Actor.mjs";
import Movie, { MovieCategoryEL } from "../m/Movie.mjs";
import {
  fillSelectWithOptions,
  createListFromMap,
  createMultiSelectionWidget,
} from "../../lib/util.mjs";
import { displaySegmentFields, undisplayAllSegmentFields } from "./app.mjs";
import Director from "../m/Director.mjs";

/***************************************************************
 Load data
 ***************************************************************/
Person.retrieveAll();
Movie.retrieveAll();

/***************************************************************
 Set up general, use-case-independent UI elements
 ***************************************************************/
// set up back-to-menu buttons for all CRUD UIs
for (const btn of document.querySelectorAll("button.back-to-menu")) {
  btn.addEventListener("click", refreshManageDataUI);
}
// neutralize the submit event for all CRUD UIs
for (const frm of document.querySelectorAll("section > form")) {
  frm.addEventListener("submit", function (e) {
    e.preventDefault();
    frm.reset();
  });
}
// save data when leaving the page
window.addEventListener("beforeunload", Movie.saveAll);

/**********************************************
 Use case Retrieve/List All Movies
 **********************************************/
document
  .getElementById("RetrieveAndListAll")
  .addEventListener("click", function () {
    document.getElementById("Movie-M").style.display = "none";
    document.getElementById("Movie-R").style.display = "block";
    const tableBodyEl = document.querySelector("section#Movie-R>table>tbody");
    tableBodyEl.innerHTML = ""; // drop old content
    for (const key of Object.keys(Movie.instances)) {
      const movie = Movie.instances[key];
      const row = tableBodyEl.insertRow();
      row.insertCell().textContent = movie.movieId;
      row.insertCell().textContent = movie.title;
      row.insertCell().textContent =
        movie.releaseDate.toLocaleDateString("en-EN");
      row.insertCell().textContent = movie.director.name;
      // Katarzyna: If there are ant actors create the list
      if (movie.actors) {
        const actListEl = createListFromMap(movie.actors, "name");
        row.insertCell().appendChild(actListEl);
      } else {
        row.insertCell().textContent = "";
      }
      if (movie.category) {
        switch (movie.category) {
          case MovieCategoryEL.TVSERIESEPISODE:
            row.insertCell().textContent = " Tv Series Episode";
            row.insertCell().textContent = movie.tvSeriesName;
            row.insertCell().textContent = movie.episodeNo;
            row.insertCell().textContent = "";
            break;
          case MovieCategoryEL.BIOGRAPHY:
            row.insertCell().textContent = "Biography";
            row.insertCell().textContent = "";
            row.insertCell().textContent = "";
            row.insertCell().textContent = movie.about;

            break;
        }
      } else {
        row.insertCell().textContent = "";
        row.insertCell().textContent = "";
        row.insertCell().textContent = "";
        row.insertCell().textContent = "";
      }
    }
  });

/**********************************************
  Use case Create Movie
 **********************************************/
const createFormEl = document.querySelector("section#Movie-C > form"),
  createCategorySelectEl = createFormEl.category,
  selectActorsEl = createFormEl["selectActors"],
  selectDirectorEl = createFormEl["selectDirector"];
document.getElementById("Create").addEventListener("click", function () {
  // set up a single selection list for selecting a Director
  fillSelectWithOptions(selectDirectorEl, Director.instances, "personId", {
    displayProp: "name",
  });
  // set up a multiple selection list for selecting actors
  fillSelectWithOptions(selectActorsEl, Actor.instances, "personId", {
    displayProp: "name",
  });
  document.getElementById("Movie-M").style.display = "none";
  document.getElementById("Movie-C").style.display = "block";
  console.log(`${MovieCategoryEL.labels}`);
  undisplayAllSegmentFields(createFormEl, MovieCategoryEL.labels);
  fillSelectWithOptions(createCategorySelectEl, MovieCategoryEL.labels);
  createFormEl.reset();
});
// set up event handlers for responsive constraint validation
createFormEl.movieId.addEventListener("input", function () {
  createFormEl.movieId.setCustomValidity(
    Movie.checkMovieIdAsId(createFormEl["movieId"].value).message
  );
});
createFormEl.title.addEventListener("input", function () {
  createFormEl.title.setCustomValidity(
    Movie.checkTitle(createFormEl.title.value).message
  );
});
createFormEl.releaseDate.addEventListener("input", function () {
  createFormEl.releaseDate.setCustomValidity(
    Movie.checkReleaseDate(createFormEl.releaseDate.value).message
  );
});
createFormEl.episodeNo.addEventListener("input", function () {
  createFormEl.episodeNo.setCustomValidity(
    Movie.checkEpisodeNo(
      createFormEl.episodeNo.value,
      parseInt(createFormEl.category.value) + 1
    ).message
  );
});
createFormEl.tvSeriesName.addEventListener("input", function () {
  createFormEl.tvSeriesName.setCustomValidity(
    Movie.checkTvSeriesName(
      createFormEl.tvSeriesName.value,
      parseInt(createFormEl.category.value) + 1
    ).message
  );
});
createFormEl.about.addEventListener("input", function () {
  createFormEl.about.setCustomValidity(
    Movie.checkAbout(createFormEl.about.value).message
  );
});
createCategorySelectEl.addEventListener(
  "change",
  handleCategorySelectChangeEvent
);
// handle Save button click events
createFormEl["commit"].addEventListener("click", function () {
  const categoryStr = createFormEl.category.value;
  const slots = {
    movieId: createFormEl["movieId"].value,
    title: createFormEl["title"].value,
    releaseDate: createFormEl["releaseDate"].value,
    actorIdRefs: [],
    directorId: createFormEl["selectDirector"].value,
  };
  if (categoryStr) {
    // enum literal indexes start with 1
    slots.category = parseInt(categoryStr) + 1;
    switch (slots.category) {
      case MovieCategoryEL.TVSERIESEPISODE:
        slots.tvSeriesName = createFormEl.tvSeriesName.value;
        createFormEl.tvSeriesName.setCustomValidity(
          Movie.checkTvSeriesName(
            createFormEl.tvSeriesName.value,
            slots.category
          ).message
        );
        slots.episodeNo = createFormEl.episodeNo.value;
        createFormEl.episodeNo.setCustomValidity(
          Movie.checkEpisodeNo(createFormEl.episodeNo.value, slots.category)
            .message
        );
        break;
      case MovieCategoryEL.BIOGRAPHY:
        slots.about = createFormEl.about.value;
        createFormEl.about.setCustomValidity(
          Movie.checkAbout(createFormEl.about.value).message
        );
        break;
    }
  }
  // check all input fields and show error messages
  createFormEl.movieId.setCustomValidity(
    Movie.checkMovieIdAsId(slots.movieId).message
  );
  createFormEl.title.setCustomValidity(Movie.checkTitle(slots.title).message);
  createFormEl.releaseDate.setCustomValidity(
    Movie.checkReleaseDate(slots.releaseDate).message
  );
  createFormEl.selectDirector.setCustomValidity(
    Movie.checkDirector(slots.directorId).message
  );
  createFormEl.about.setCustomValidity(Movie.checkAbout(slots.about).message);
  // get the list of selected actors
  const selActorOptions = createFormEl.selectActors.selectedOptions;
  // save the input data only if all form fields are valid
  if (createFormEl.checkValidity()) {
    // construct a list of actor ID references
    for (const opt of selActorOptions) {
      slots.actorIdRefs.push(opt.value);
    }
    Movie.add(slots);
    undisplayAllSegmentFields(createFormEl, MovieCategoryEL.labels);
  }
});

/**********************************************
 * Use case Update Movie
 **********************************************/
const updateFormEl = document.querySelector("section#Movie-U > form"),
  updSelMovieEl = updateFormEl["selectMovie"],
  updateSelectCategoryEl = updateFormEl["category"];
undisplayAllSegmentFields(updateFormEl, MovieCategoryEL.labels);
document.getElementById("Update").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  updSelMovieEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions(updSelMovieEl, Movie.instances, "movieId", {
    displayProp: "title",
  });
  document.getElementById("Movie-M").style.display = "none";
  document.getElementById("Movie-U").style.display = "block";
  updateFormEl.reset();
});
/**
 * handle Movie selection events: when a Movie is selected,
 * populate the form with the data of the selected Movie
 */
updSelMovieEl.addEventListener("change", handleMovieSelectChangeEvent);

console.log(`${MovieCategoryEL.labels}`);
fillSelectWithOptions(updateSelectCategoryEl, MovieCategoryEL.labels);
updateSelectCategoryEl.addEventListener(
  "change",
  handleCategorySelectChangeEvent
);
// handle Save button click events
updateFormEl["commit"].addEventListener("click", function () {
  const movieIdRef = updSelMovieEl.value,
    categoryStr = updateFormEl.category.value,
    selectActorsWidget = updateFormEl.querySelector(".MultiSelectionWidget"),
    selectedActorsListEl = selectActorsWidget.firstElementChild;
  if (!movieIdRef) return;
  var slots = {
    movieId: updateFormEl["movieId"].value,
    title: updateFormEl["title"].value,
    releaseDate: updateFormEl["releaseDate"].value,
    directorId: updateFormEl["selectDirector"].value,
  };
  if (categoryStr) {
    slots.category = parseInt(categoryStr) + 1;
    switch (slots.category) {
      case MovieCategoryEL.TVSERIESEPISODE:
        slots.tvSeriesName = updateFormEl.tvSeriesName.value;
        updateFormEl.tvSeriesName.setCustomValidity(
          Movie.checkTvSeriesName(slots.tvSeriesName, slots.category).message
        );
        slots.episodeNo = updateFormEl.episodeNo.value;
        createFormEl.episodeNo.setCustomValidity(
          Movie.checkEpisodeNo(createFormEl.episodeNo.value, slots.category)
            .message
        );
        break;
      case MovieCategoryEL.BIOGRAPHY:
        slots.about = updateFormEl.about.personId;
        updateFormEl.about.setCustomValidity(
          Movie.checkAbout(slots.about).message
        );
        break;
    }
  }
  // check all input fields and show error messages
  updateFormEl.title.setCustomValidity(Movie.checkTitle(slots.title).message);
  updateFormEl.releaseDate.setCustomValidity(
    Movie.checkReleaseDate(slots.releaseDate).message
  );
  updateFormEl.selectDirector.setCustomValidity(
    Movie.checkDirector(slots.directorId).message
  );
  updateFormEl.about.setCustomValidity(Movie.checkAbout(slots.about).message);

  // add event listeners for responsive validation
  updateFormEl.title.addEventListener("input", function () {
    updateFormEl.title.setCustomValidity(
      Movie.checkTitle(updateFormEl.title.value).message
    );
  });
  updateFormEl.releaseDate.addEventListener("input", function () {
    updateFormEl.releaseDate.setCustomValidity(
      Movie.checkReleaseDate(updateFormEl.releaseDate.value).message
    );
  });
  if (!updateFormEl.selectDirector.value) {
    updateFormEl.selectDirector.setCustomValidity(
      updateFormEl.selectDirector.selectedOptions > 0
        ? ""
        : "No directors selected!"
    );
  }
  updateFormEl.releaseDate.addEventListener("input", function () {
    updateFormEl.category.setCustomValidity(
      Movie.checkCategory(updateFormEl.category.value).message
    );
  });
  if (updateFormEl.category) {
    const cat = parseInt(updateFormEl.category) + 1;
    switch (cat) {
      case MovieCategoryEL.TVSERIESEPISODE:
        updateFormEl.releaseDate.addEventListener("input", function () {
          updateFormEl.episodeNo.setCustomValidity(
            Movie.checkEpisodeNo(updateFormEl.episodeNo.value).message
          );
        });
        updateFormEl.releaseDate.addEventListener("input", function () {
          updateFormEl.tvSeriesName.setCustomValidity(
            Movie.checkTvSeriesName(updateFormEl.tvSeriesName.value).message
          );
        });
        break;
      case MovieCategoryEL.BIOGRAPHY:
        updateFormEl.releaseDate.addEventListener("input", function () {
          updateFormEl.about.setCustomValidity(
            Movie.checkAbout(updateFormEl.about.value).message
          );
        });
        break;
    }
  }
  // commit the update only if all form field values are valid
  if (updateFormEl.checkValidity()) {
    // construct actorIdRefs-ToAdd/ToRemove lists
    const actorsIdRefsToAdd = [],
      actorsIdRefsToRemove = [];
    for (const actorItemEl of selectedActorsListEl.children) {
      if (actorItemEl.classList.contains("removed")) {
        actorsIdRefsToRemove.push(actorItemEl.getAttribute("data-value"));
      }
      if (actorItemEl.classList.contains("added")) {
        actorsIdRefsToAdd.push(actorItemEl.getAttribute("data-value"));
      }
    }
    // if the add/remove list is non-empty, create a corresponding slot
    if (actorsIdRefsToRemove.length > 0) {
      slots.actorsIdRefsToRemove = actorsIdRefsToRemove;
    }
    if (actorsIdRefsToAdd.length > 0) {
      slots.actorsIdRefsToAdd = actorsIdRefsToAdd;
    }

    // drop widget content
    selectActorsWidget.innerHTML = "";
    Movie.update(slots);
    // un-render all segment/category-specific fields
    undisplayAllSegmentFields(updateFormEl, MovieCategoryEL.labels);
    // update the movie selection list's option element
    updSelMovieEl.options[updSelMovieEl.selectedIndex].text = slots.title;
  }
});

/**********************************************
 * Use case Delete Movie
 **********************************************/
const deleteFormEl = document.querySelector("section#Movie-D > form");
const delSelMovieEl = deleteFormEl["selectMovie"];
document.getElementById("Delete").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  delSelMovieEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions(delSelMovieEl, Movie.instances, "movieId", {
    displayProp: "title",
  });
  document.getElementById("Movie-M").style.display = "none";
  document.getElementById("Movie-D").style.display = "block";
  deleteFormEl.reset();
});
// handle Delete button click events
deleteFormEl["commit"].addEventListener("click", function () {
  const movieIdRef = delSelMovieEl.value;
  if (!movieIdRef) return;
  if (confirm("Do you really want to delete this movie?")) {
    Movie.destroy(movieIdRef);
    // remove deleted Movie from select options
    delSelMovieEl.remove(delSelMovieEl.selectedIndex);
  }
});

/**********************************************
 * Refresh the Manage Movie Data UI
 **********************************************/
function refreshManageDataUI() {
  // show the manage Movie UI and hide the other UIs
  document.getElementById("Movie-M").style.display = "block";
  document.getElementById("Movie-R").style.display = "none";
  document.getElementById("Movie-C").style.display = "none";
  document.getElementById("Movie-U").style.display = "none";
  document.getElementById("Movie-D").style.display = "none";
}

function handleCategorySelectChangeEvent(e) {
  const formEl = e.currentTarget.form,
    // the array index of MovieCategoryEL.labels
    categoryIndexStr = formEl.category.value;
  if (categoryIndexStr) {
    displaySegmentFields(
      formEl,
      MovieCategoryEL.labels,
      parseInt(categoryIndexStr) + 1
    );
  } else {
    undisplayAllSegmentFields(formEl, MovieCategoryEL.labels);
  }
}
// Set up Manage Movie UI
refreshManageDataUI();

function handleMovieSelectChangeEvent() {
  const saveButton = updateFormEl["commit"],
    selectActorsWidget = updateFormEl.querySelector(".MultiSelectionWidget"),
    selectDirectorEl = updateFormEl["selectDirector"],
    movieId = updateFormEl["selectMovie"].value;
  if (movieId) {
    const movie = Movie.instances[movieId];
    updateFormEl["movieId"].value = movie.movieId;
    updateFormEl["title"].value = movie.title;
    updateFormEl["releaseDate"].valueAsDate = new Date(movie.releaseDate);
    // set up the associated director selection list
    fillSelectWithOptions(
      selectDirectorEl,
      Director.instances,
      "personId",
      "name"
    );
    // set up the associated actor selection widget
    createMultiSelectionWidget(
      selectActorsWidget,
      movie.actors,
      Person.instances,
      "personId",
      "name"
    );
    // assign associated director as the selected option to select element
    updateFormEl["selectDirector"].value = movie.director.personId;
    saveButton.disabled = false;
    if (movie.category) {
      updateFormEl.category.selectedIndex = movie.category;
      // show category-dependent fields
      updateFormEl.category.disabled = "disabled";
      displaySegmentFields(
        updateFormEl,
        MovieCategoryEL.labels,
        movie.category
      );
      switch (movie.category) {
        case MovieCategoryEL.TVSERIESEPISODE:
          updateFormEl.tvSeriesName.value = movie.tvSeriesName;
          updateFormEl.episodeNo.value = movie.episodeNo;
          updateFormEl.about.value = "";
          break;
        case MovieCategoryEL.BIOGRAPHY:
          updateFormEl.about.value = movie.about;
          updateFormEl.tvSeriesName.value = "";
          updateFormEl.episodeNo.value = "";
          break;
      }
    } else {
      updateFormEl.category.value = "";
      updateFormEl.category.disabled = ""; // enable category selection
      updateFormEl.tvSeriesName.value = "";
      updateFormEl.about.value = "";
      updateFormEl.episodeNo.value = "";
      undisplayAllSegmentFields(updateFormEl, MovieCategoryEL.labels);
    }
  } else {
    updateFormEl.reset();
    updateFormEl["selectDirector"].selectedIndex = 0;
    selectActorsWidget.innerHTML = "";
    saveButton.disabled = true;
  }
}
