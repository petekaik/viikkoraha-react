import React, { Component } from 'react';
import logo from './img/logo.svg';
import mail from './img/mail.svg';
import groceries from './img/groceries.svg';
import recycle from './img/recycle.svg';
import cleaning from './img/cleaning.svg';
import cooking from './img/cooking.svg';
import baby from './img/baby.svg';
import dishes from './img/dishes.svg';
import laundry from './img/laundry.svg';
import './css/App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />

          <button>
            <img src={mail} className="App-icons" alt="mail" />
            <br />
            Posti: 1€
          </button>
          <button>
            <img src={groceries} className="App-icons" alt="groceries" />
            <br />
            Kauppa: 1€
          </button>
          <button>
            <img src={recycle} className="App-icons" alt="recycle" />
            <br />
            Roskat: 1€
          </button>
          <button>
            <img src={cleaning} className="App-icons" alt="cleaning" />
            <br />
            Siivoaminen: 1€
          </button>
          <button>
            <img src={cooking} className="App-icons" alt="cooking" />
            <br />
            Ruoka: 1€
          </button>
          <button>
            <img src={baby} className="App-icons" alt="baby" />
            <br />
            Hoitoapu: 1€
          </button>
          <button>
            <img src={dishes} className="App-icons" alt="dishes" />
            <br />
            Tiskikone: 1€
          </button>
          <button>
            <img src={laundry} className="App-icons" alt="laundry" />
            <br />
            Pyykit: 1€
          </button>
        </header>
      </div>
    );
  }
}

export default App;
