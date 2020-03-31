import React, { useState, useEffect } from 'react';
import MapChart from "./MapChart";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDotCircle } from '@fortawesome/free-regular-svg-icons';
import { faHeartBroken, faHeartbeat, faThermometerThreeQuarters, faProcedures, faGlobeEurope } from '@fortawesome/free-solid-svg-icons';

import Utils from "./Utils";

function App() {
  const [activeConfirmed, setActiveConfirmed] = useState(0);
  const [totalConfirmed, setTotalConfirmed] = useState(0);
  const [totalRecovered, setTotalRecovered] = useState(0);
  const [totalDeceased, setTotalDeceased] = useState(0);
  const [totalConfirmedactiveConfirmed, setTotalConfirmedProjected] = useState(0);
  // 0 => USD, 1 => EUR, 2 => Date, 3 => Time
  const [activeInfoField, setActiveInfoField] = useState(0);
  const [InfoFieldUSD, setInfoFieldUSD] = useState(0);
  const [InfoFieldEUR, setInfoFieldEUR] = useState(0);
  // const [InfoFieldBIST, setInfoFieldBIST] = useState(0);
  const [InfoFieldsDateTime, setInfoFieldsDateTime] = useState(0);

  useEffect(() => {
    fetch('https://api.exchangeratesapi.io/latest?base=TRY')
      .then((response) => {
        if (response.ok) {
          // const xmlParser = new DOMParser();
          // let xmlString = xmlParser.parseFromString(response.text(), 'text/xml');
          // xmlString.querySelectorAll('Currency').forEach(node => {
          //   if (["EUR", "USD", "BPS"].includes(node.querySelector('Banknote').textContent)) {
          //     console.info(node.querySelector('BanknoteBuying'));
          //   }
          // })
          response.json().then((body) => {
            if (body.rates) {
              setInfoFieldEUR(body.rates.EUR);
              setInfoFieldUSD(body.rates.USD);
            }
          });
        } else {
          throw new Error(`Request failed with code ${response.status}`);
        }
      })
      .catch((error) => console.log(error));
  
      setInfoFieldsDateTime(new Date())
      setInterval(() => setInfoFieldsDateTime(new Date()), 15000);
  
      setInterval(() => setActiveInfoField(activeInfoField => (activeInfoField + 1) % 4), 10000);
  }, []);

  let infoFieldText = null;

  switch (activeInfoField) {
    case 0:
      infoFieldText = "USD " + (1 / InfoFieldUSD).toString().substring(0, 6);
      break;
    case 1:
      infoFieldText = "EUR " + (1/ InfoFieldEUR).toString().substring(0, 6);
      break;
    case 2:
    //   infoFieldText = "BIST ";
    //   break;
    // case 3:
      infoFieldText = `${`0${InfoFieldsDateTime.getDate()}`.substr(-2)}/${`0${InfoFieldsDateTime.getMonth()+1}`.substr(-2)}/${InfoFieldsDateTime.getFullYear()}`;
      break;
    case 3:
      infoFieldText = `${`0${InfoFieldsDateTime.getHours()}`.substr(-2)}:${`0${InfoFieldsDateTime.getMinutes()}`.substr(-2)}`;
      break;
    default:
      break;
  }

  return (
    [
      <Navbar bg="light" fixed="top">
        <Navbar.Brand className="mr-auto">
            {/* <span className="small">C<FontAwesomeIcon icon={faDotCircle} />VID19 </span>
            <span className={"mapio"}><b>MAP</b><span className="text-secondary">.IO</span></span> */}
        </Navbar.Brand>
        <Container>
          <div className={"font-weight-bold text-primary mr-2"}>
            <FontAwesomeIcon icon={faGlobeEurope} className={"mr-1"}/>
            Dünya
          </div>
          <div className={"small text-warning mr-2"}>
            <FontAwesomeIcon icon={faThermometerThreeQuarters} className={"mr-1"}/>
            Toplam Hasta
            <br />
            <span className="font-weight-bolder" style={{ fontSize: '1rem', letterSpacing: '2px' }}>
              {Utils.rounded(totalConfirmed)}
            </span>
          </div>
          <div className={"small text-danger mr-2"}>
            <FontAwesomeIcon icon={faProcedures} className={"mr-1"}/>
            Aktif Hasta
            <br />
            <span className="font-weight-bolder" style={{ fontSize: '1rem', letterSpacing: '2px' }}>
              {Utils.rounded(activeConfirmed)}
            </span>
          </div>
          <div className={"small text-success mr-2"}>
            <FontAwesomeIcon icon={faHeartbeat} className={"mr-1"} />
            Toplam İyileşen
            <br />
            <span className="font-weight-bolder" style={{ fontSize: '1rem', letterSpacing: '2px' }}>
              {Utils.rounded(totalRecovered)}
            </span>
          </div>
          <div className={"small mr-2"}>
            <FontAwesomeIcon icon={faHeartBroken} className={"mr-1"} />
            Toplam Ölümler
            <br />
            <span className="font-weight-bolder" style={{ fontSize: '1rem', letterSpacing: '2px' }}>
              {Utils.rounded(totalDeceased)}
            </span>
          </div>
        </Container>
      </Navbar>,
      <Container fluid className={"w-100 h-100 p-0"}>
        <Row noGutters={"true"} className={"h-100"}>
          <Col className={"h-100"}>
            <MapChart
                key={"mapChart"}
                setActiveConfirmed={setActiveConfirmed}
                setTotalConfirmed={setTotalConfirmed}
                setTotalRecovered={setTotalRecovered}
                setTotalDeceased={setTotalDeceased}
                setTotalConfirmedProjected={setTotalConfirmedProjected}
            />
          </Col>
        </Row>
      </Container>,
      <Navbar bg="light" fixed="bottom" className="footer">
        <div className="slidingNews"></div>
        <div className="switchingInfoBox">
          {infoFieldText !== null ? infoFieldText : ""}
        </div>
      </Navbar>
    ]
  );
}

export default App;
