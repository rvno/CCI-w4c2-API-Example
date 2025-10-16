const spaceContainerISS = document.getElementById("craft-iss");
const spaceContainerTian = document.getElementById("craft-tiangong");
const allCrafts = document.querySelectorAll(".craft");
const statusButton = document.getElementById("status");
const spacetrack = document.getElementById("spacetrack");
const launchButton = document.getElementById('launch');
let distances = [];
let astronauts = [];
let astroEls = [];
function checkForAstronauts(button) {
  button.style.display = "none"; // hide button

  //   The line below will pull the data from the API
  fetch(
    "https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json"
  )
    //   The line below will pull the data from the locally stored JSON file
    //   fetch("/ex-json/astros.json")
    .then(response => {
      return response.json();
    })
    .then(data => {
      console.log(data);
      launchButton.classList.remove('hidden')
      

      // Update the Message
     statusButton.innerHTML = `Houston we have liftoff!`;

      // Add each Astronaut to their craft
      var astros = data.people;
      astros.forEach(astro => {
        AddAstro(astro);
        // astros.push(astro);
        // console.log(astro);
        astronauts.push(astro);
      });
    })
    .catch(error => {
      console.error("Error loading JSON:", error);

      // Update the Error Message
      statusButton.innerHTML = `Technical difficulties, abort mission.`
    });
}

function launchEm() {
  let distances = astronauts.map((astro) => astro.days_in_space);
  // console.log(astros)
  // debugger;
  let greatestDistance = Math.max(...distances);
  console.log(greatestDistance);

  distances.forEach((distance, i) => {
    console.log(distances[i])
    let initDistance = distances[i];
    // initDistance = initDistance === 0 ? 1 : initDistance;
    if (initDistance === 0) {
      astroEls[i].style.setProperty('--distance', (1 + 20) / greatestDistance);
    } else {
      astroEls[i].style.setProperty('--distance', initDistance / greatestDistance);
    }
    astroEls[i].classList.add('flying');
  })
}

function AddAstro(astro) {
  let div = document.createElement("div");
  div.classList.add("astro");
  div.innerHTML = astro.name;
  let image = document.createElement('img');
  image.src = astro.image;
  image.classList.add("astro__image")
  div.appendChild(image);

  spacetrack.appendChild(div);
  astroEls.push(div);
}
