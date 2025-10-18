let citations = [];
let sortedCitations = {};
let modalOpen = false;

function checkForCitations(button) {
  //   The line below will pull the data from the API
  fetch(
    "citations.json"
    // "https://data.sfgov.org/resource/ab4h-6ztd.json?$query=SELECT%0A%20%20%60violation_desc%60%2C%0A%20%20%60vehicle_plate_state%60%2C%0A%20%20%60vehicle_plate%60%2C%0A%20%20%60fine_amount%60%2C%0A%20%20%60longitude%60"
  )
    //   The line below will pull the data from the locally stored JSON file
    //   fetch("/ex-json/astros.json")
    .then(response => {
      return response.json();
    })
    .then(data => {
      // console.log(data);

      citations = data;
      
      organizeCitations(citations);

      console.log(sortedCitations)

      // create a citation for each
      for (let citation in  sortedCitations) {
        let type = citation
        let data = sortedCitations[type]
        let newCitation = new Citation(citation, data);
      }



      
      // Download the JSON
      // let filename = 'citations';
      // const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `${filename}.json`;
      // document.body.appendChild(a); // Append to body to make it clickable
      // a.click();
      // document.body.removeChild(a); // Remove after click
      // URL.revokeObjectURL(url);
    
      

    
    })
    .catch(error => {
      console.error("Error loading JSON:", error);
    });
}

function organizeCitations(data) {
  data.forEach((citation) => {
    if (sortedCitations.hasOwnProperty(citation.violation_desc)) {
      if (citation.vehicle_plate)
        sortedCitations[citation.violation_desc]['plates'].push(citation.vehicle_plate)
      if (citation.fine_amount)
        sortedCitations[citation.violation_desc]['fines'].push(citation.fine_amount)
    } else {
      sortedCitations[citation.violation_desc] = {'plates': [citation.vehicle_plate], 'fines': [citation.fine_amount]}
    }
  })
}

class Citation {
  constructor(type, data) {
    this.type = type
    this.plates = data.plates;
    this.fines = data.fines;
    
    this.calculateFinesTotal = this.calculateFinesTotal.bind(this);
    this.displayPlates = this.displayPlates.bind(this);
    this.createPlate = this.createPlate.bind(this);
    this.calculateFinesTotal()
    this.display();
    this.el.addEventListener('click', this.displayPlates);
  }

  calculateFinesTotal() {
    this.fines = this.fines.map((fine) => parseFloat(fine));
    this.totalFines = this.fines.reduce((acc, curr) => acc + curr, 0)
  } 
  
  display() {
    const citations = document.querySelector('.citations');
    const cW = citations.offsetWidth;
    const cH = citations.offsetHeight;

    let el = document.createElement('div');
    el.classList.add('citation', 'citation--floating');
    el.setAttribute('tabindex', 0);
    el.innerHTML = `
      <div class="citation__content">
        <hr>
        <img class="citation__logo" src="sfmta-logo.png" alt="SFMTA Logo" />
        <h2 class="citation__title">Notice of Parking Citation</h2>
        <p class="citation__description">The vehicle described below is illegally parked in violation of the section
          referenced below.<br><br><b>Payment</b> or request for administrative review is required <b>within 21 days</b>
          or further penalties may be assessed.</em></p>
        <div class="citation__reference">
          <span class="citation__reference__label">Citation #</span>
          <span class="citation__reference__number">#########</span>
        </div>
        <div class="citation__data">
          <div class="citation__data__type citation__data__type--violation"><span class="obnoxious blue">In violation of
              section</span><strong>${this.type}</strong></div>
          <div class="citation__data__type citation__data__type--amount">AMOUNT DUE:<strong>$${this.totalFines}</strong></div>
        </div>
        <p class="citation__comment">Comments: <span>:(</span></p>
        <p class="citation__post">Posted</p>
        <div class="citation__footer">
          <h3 class="blue"><i>Certificate of Correction</i></h3>
          <p class="citation__footer__star">Star<br>No.</p>
          <hr>
          <p class="citation__footer__footnote">Officer's Signature CVC: 400(a) 5200 5201(a) 5201(b). 5201(c) 5204</p>
        </div>
    `
    el.style.setProperty('--left', `${Math.random() * cW}px`);
    el.style.setProperty('--top', `${Math.random() * cH}px`);
    this.el = el;

    citations.appendChild(el);
  }

  displayPlates() {
    const modal = document.querySelector('.modal')
    modal.classList.add('modal--open');
    const mW = modal.offsetWidth;
    const mH = modal.offsetHeight;
    
    this.plates.forEach((plate) => {
      // console.log(plate)
      // let newPlate = this.createPlate(plate)
      // console.log(newPlate);
      let el = document.createElement('div');
      el.classList.add('plate');
      el.setAttribute('tabindex', 0);
      el.innerHTML = `
        <div class="plate">
          <h2>California</h2>
          <p>${plate}</p>
        </div>
      `
      el.style.setProperty('--pLeft', `${Math.random() * mW}px`);
      el.style.setProperty('--pTop', `${Math.random() * mH}px`);
      // debugger;
      modal.appendChild(el);
    })
  }

  createPlate(plate) {
    let el = document.createElement('div');
    el.classList.add('plate');
    el.setAttribute('tabindex', 0);
    el.innerHTML = `
      <div class="plate">
        <h2>California</h2>
        <p>${plate}</p>
      </div>
    `
    return plate
  }

  
}
