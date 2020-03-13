import React, {useState} from 'react';
import MapChart from "./MapChart";
import ReactTooltip from "react-tooltip";
import NavDropdown from 'react-bootstrap/NavDropdown';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserMd, faDatabase, faCode } from '@fortawesome/free-solid-svg-icons';
import { faBookDead} from '@fortawesome/free-solid-svg-icons';

function App() {
  const [content, setContent] = useState("");
  return (

        [
          <Navbar bg="light" fixed="top" className={"p-0 pl-2"}  expand="lg">
            <Navbar.Brand>
                <FontAwesomeIcon icon={faUserMd} />
                <span className="small"> COVID19 </span>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" className={"border-0 "} />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="mr-auto">
                <Nav.Link className="small" href={"https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_time_series"}>
                  <FontAwesomeIcon icon={faDatabase} /> Data source
                </Nav.Link>
                <Nav.Link className="small" href={"https://github.com/daniel-karl/covid19-map"}>
                  <FontAwesomeIcon icon={faCode} /> Source code
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Navbar>,

          <Container fluid className={"p-0"}>
            <Row noGutters={"true"}>
              <Col>
                <MapChart setTooltipContent={setContent} />
                <ReactTooltip>{content}</ReactTooltip>
              </Col>
            </Row>
          </Container>
        ]
  );
}

export default App;
