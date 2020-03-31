import React, {memo} from "react";
import { Map, TileLayer, Tooltip as LTooltip,
    CircleMarker, LayerGroup } from "react-leaflet";

import Tooltip from '@material-ui/core/Tooltip';
import LinearProgress from '@material-ui/core/LinearProgress';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faProcedures,
  faHeartbeat,
  faHeartBroken,
  faVial,
  faExclamationTriangle,
  faThermometerThreeQuarters
} from '@fortawesome/free-solid-svg-icons';

import Badge from 'react-bootstrap/Badge';
import Container from "react-bootstrap/Container";

import BarChart from "./BarChart";
import { JHDatasourceProvider } from "./datasource/JHDatasourceProvider";
import * as Population from "./Population";
import * as Testing from "./TestingRates";
import Utils from "./Utils";

import { withStyles } from '@material-ui/core/styles';

const LightTooltip = withStyles(theme => ({
  tooltip: {
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
  },
}))(Tooltip);

const ONE_M=1000000;

class MapChart extends Map {

  constructor(props) {
    super(props);

    this.state = {
      setActiveConfirmed: props.setActiveConfirmed,
      setTotalConfirmed: props.setTotalConfirmed,
      setTotalRecovered: props.setTotalRecovered,
      setTotalDeceased: props.setTotalDeceased,
      setTotalConfirmedProjected: props.setTotalConfirmedProjected,
      factor: 50,
      logmode: true,
      momentum: "none",
      ppmmode: false,
      testmode: true,
      testscale: 0,
      dayOffset: 0,
      playmode: false,
      mapstyle: "https://{s}.tile.osm.org/{z}/{x}/{y}.png",
      selectedData: ["projected", "confirmed", "recovered", "deceased"],
      datasource: null,
      leadership: "active",
      selectedLocations: ["Hubei, China", "Italy", "US", "Spain", "Germany", "France", "Iran", "United Kingdom", "Switzerland", "Austria"],
      showUScounties: false,

      lat: 0,
      lng: 0,
      zoom: 2,

      // chart: "pie",
      //width: 2,
    };

    this.map = null;

    let that = this;
    new JHDatasourceProvider().getDatasource(false,  (datasource) => {
      that.state.datasource = datasource;
      that.setState({});
    });
  }

  componentDidMount = () => {
      this.render();
  };

  componentDidUpdate = (prevProps) => {
    if(this.state.datasource) {
      this.updateLeafletElement(prevProps, this.props);
      const layers = this.map.leafletElement._layers;

      // bring to front one by one
      Object.values(layers).map((layer) => {
        if (layer.options.className === "projected") {
          layer.bringToFront();
        }
      });

      Object.values(layers).map((layer) => {
        if (layer.options.className === "confirmed") {
          layer.bringToFront();
        }
      });

      Object.values(layers).map((layer) => {
        if (layer.options.className === "recovered") {
          layer.bringToFront();
        }
      });

      Object.values(layers).map((layer) => {
        if (layer.options.className === "deceased") {
          layer.bringToFront();
        }
      });
    }
  };

  render() {
    if(!this.state.datasource) {
      return (<LinearProgress />);
    }
    else {
      let that = this;
      let ds = this.state.datasource.datasets[Math.max(0, this.state.datasource.datasets.length - 1 + this.state.dayOffset)];
      that.state.setActiveConfirmed(ds.totalActive);
      that.state.setTotalConfirmed(ds.totalConfirmed);
      that.state.setTotalRecovered(ds.totalRecovered);
      that.state.setTotalDeceased(ds.totalDeceased);
      that.state.setTotalConfirmedProjected(ds.totalConfirmedProjected * that.state.testscale);
      return (
          <>
            {that.leafletMap(ds)}
            {that.leaderboard(ds)}
            {that.localStats(ds)}
          </>
      );
    }
  }

  leaderboard = (ds) => {
    let firstEight = [];
    return (
      <div className="leaderboard">
        <div className="slideshowWrapper">
          <div className="slideshowContainer">
          {
              Object.keys(ds.data).sort((a, b) => {
                let mode = "absolute";
                let ca = a;
                let cb = b;
                ca = ds.data[a][mode].current[this.state.leadership];
                ca = isNaN(ca) ? 0 : ca;
                cb = ds.data[b][mode].current[this.state.leadership];
                cb = isNaN(cb) ? 0 : cb;
                if(ca === null && cb === null) {
                  return 0;
                } else if(ca === null) {
                  return 1;
                } else if(cb === null) {
                  return -1;
                } else {
                  return (ca >= cb) ? -1 : 1;
                }
              }).map((name, locationIndex) => {
                let confirmed = ds.data[name].absolute.current.confirmed;
                let active = ds.data[name].absolute.current.active;
                active = isNaN(active) ? "N/A" : active;
                let recovered = ds.data[name].absolute.current.recovered;
                let deceased = ds.data[name].absolute.current.deceased;
                let returningDiv = (
                  <div
                    className="locationSelect"
                    onClick={() =>{
                        this.state.selectedLocations.pop();
                        this.state.selectedLocations.push(name);
                        this.setState({
                            lng: this.state.datasource.locations[name][0],
                            lat: this.state.datasource.locations[name][1],
                            zoom: 5 + Math.random() / 10
                        })
                    }}
                  >
                    <div className={"p-1 text-muted mono statIndex"} align={"center"}>
                      {locationIndex + 1}
                    </div>
                    <div>
                      <div className="statLine">
                        <div
                          className={"p-1 country"}
                          style={name.length > 20
                            ? { fontSize: '0.8rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }
                            : {}
                          }
                        >
                          {name}
                        </div>
                        <div className={"p-1 stat bg-danger text-light"} align={"right"}>  
                          <FontAwesomeIcon icon={faProcedures} className={"mr-1"} />
                          {active}
                        </div>
                      </div>
                      <div className="statLine">
                        <div className={"p-1 stat text-warning"} align={"right"}>
                          <FontAwesomeIcon icon={faThermometerThreeQuarters} className={"mr-1"} />
                          {confirmed}
                        </div>
                        <div className={"p-1 stat text-success"} align={"right"}>
                          <FontAwesomeIcon icon={faHeartbeat} className={"mr-1"} />
                          {recovered}
                        </div>
                        <div className={"p-1 stat text-dark"} align={"right"}>
                          <FontAwesomeIcon icon={faHeartBroken} className={"mr-1"} />
                          {deceased}
                        </div>
                      </div>
                    </div>
                  </div>
                );
                if (locationIndex < 8) {
                  firstEight.push(returningDiv);
                  return returningDiv;
                } else if (locationIndex === Object.keys(ds.data).length - 1) {
                  return [
                    returningDiv,
                    ...firstEight,
                  ];
                }
                return returningDiv;
              })
            }
          </div>
        </div>
      </div>
    );
  };

  localStats = (ds) => {
    return (
    <div className="localStats">
      <span className="localStats-title">
        <img src="tr-flag.png" alt="Turkey" height="120px"/>
        Türkiye Verileri
      </span>
      <Container>
        <div className={"bg-warning text-white mr-2 localBox"}>
          <FontAwesomeIcon icon={faThermometerThreeQuarters} className={"mr-1"} size="4x" />
          <div>
            Toplam Hasta
            <br />
            <span className="font-weight-bolder" style={{ fontSize: '1.5rem', letterSpacing: '2px' }}>
              {Utils.rounded(ds.data['Turkey'].absolute.current.confirmed)}
            </span>
          </div>
        </div>
        <div className={"bg-danger text-white mr-2 localBox"}>
          <FontAwesomeIcon icon={faProcedures} className={"mr-1"} size="2x" />
          <div>
            Aktif Hasta
            <br />
            <span className="font-weight-bolder" style={{ fontSize: '1.5rem', letterSpacing: '2px' }}>
              {Utils.rounded(ds.data['Turkey'].absolute.current.active)}
            </span>
          </div>
        </div>
        <div className={"bg-success text-white mr-2 localBox"}>
          <FontAwesomeIcon icon={faHeartbeat} className={"mr-1"} size="3x" />
          <div>
            Toplam İyileşen
            <br />
            <span className="font-weight-bolder" style={{ fontSize: '1.5rem', letterSpacing: '2px' }}>
              {Utils.rounded(ds.data['Turkey'].absolute.current.recovered)}
            </span>
          </div>
        </div>
        <div className={"bg-dark text-white mr-2 localBox"}>
          <FontAwesomeIcon icon={faHeartBroken} className={"mr-1"} size="3x" />
          <div>
            Toplam Ölümler
            <br />
            <span className="font-weight-bolder" style={{ fontSize: '1.5rem', letterSpacing: '2px' }}>
              {Utils.rounded(ds.data['Turkey'].absolute.current.deceased)}
            </span>
          </div>
        </div>
      </Container>
    </div>
    );
  }

  leafletMap = (ds) => {
    const position = [this.state.lat, this.state.lng];
    return (
      <Map ref={(ref) => { this.map = ref}} center={position} zoom={this.state.zoom} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors | Served by ERSTREAM &reg;'
            url={this.state.mapstyle}
        />

        <LayerGroup key={5}>
          { this.momentumMarkers(ds) }
        </LayerGroup>

        <LayerGroup key={4} className={"deceasedLayer"}>
          { this.projectedMarkers(ds) }
        </LayerGroup>

        <LayerGroup key={3} className={"deceasedLayer"}>
          { this.confirmedMarkers(ds) }
        </LayerGroup>

        <LayerGroup key={2} className={"recoveredLayer"}>
          { this.recoveredMarkers(ds) }
        </LayerGroup>

        <LayerGroup key={1} className={"deceasedLayer"}>
          { this.deceasedMarkers(ds) }
        </LayerGroup>
      </Map>
    );
  };

  momentumMarkers = (ds) => {
    return (
      this.state.momentum !== "none" &&
      Object.keys(ds.data).map((name, locationIndex) => {
        if(ds.data[name].absolute.current.confirmed === -1) {
            return;
        }
        let pop = Population.ABSOLUTE[name];
        let size;
        switch (this.state.momentum) {
          case "last1":
            size = ds.data[name].absolute.growthLast1Day.active / this.state.datasource.maxValue;
            break;
          case "last3":
            size = ds.data[name].absolute.growthLast3Days.active / this.state.datasource.maxValue;
            break;
          case "last7":
            size = ds.data[name].absolute.growthLast7Days.active / this.state.datasource.maxValue;
            break;
          default:
            break;
        }
        let pos = size >= 0;
        size = Math.abs(size);
        size = this.scaleLog(size);
        size = this.scalePpm(size, pop);
        size = this.scaleLogAndPpm(size);
        let coordinates = this.state.datasource.locations[name];
        if (size > 0) {
          return (
              <CircleMarker
                  key={"change_" + locationIndex}
                  style={this.state.chart === "pie" ? {display: "block"} : {display: "none"}}
                  center={[coordinates[1], coordinates[0]]}
                  fillColor={pos ? "#FF0000" : "#00FF00"}
                  radius={isNaN(size) ? 0 : Math.sqrt(size) * this.state.factor}
                  opacity={0}
                  fillOpacity={0.5}
              />
          );
        }
        return "";
      })
    );
  };

  /*<Marker coordinates={coordinates} key={"change_" + rowId}>
              <circle r={isNaN(size)?0:Math.sqrt(size) * this.state.factor} fill={pos ? "#F008" : "#0F08"} />
              <title>
                {`${name} - ${Math.abs(val)} ${pos ? "INCREASE" : "DECREASE"} in active(= confirmed-recovered) cases (excl. deceased) (${Math.round(ONE_M*val/pop)} ppm)`
                }
              </title>
              <text
                textAnchor="middle"
                y={markerOffset}
                style={{ fontSize: name.endsWith(", US") ? "0.005em" : "2px", fontFamily: "Arial", fill: "#5D5A6D33", pointerEvents: "none" }}
              >
                {name}
              </text>
            </Marker>*/

  projectedMarkers = (ds) => {
    let that = this;
    return (
      this.state.momentum==="none" &&
        Object.keys(ds.data).map((name, locationIndex) => {
          let value = ds.data[name].absolute.current.confirmedProjected / that.state.datasource.maxValue * that.state.testscale;
          // let value = ds.data[name].ppm.current.confirmedProjected;
          let size = this.scale(value, Population.ABSOLUTE[name]);
          return this.marker(locationIndex, that.state.datasource.locations[name], "#00F", size, ds.data[name], name, "projected", 0.5);
        })
    )
  };

  confirmedMarkers = (ds) => {
    let that = this;
    return (
      this.state.momentum==="none" &&
        Object.keys(ds.data).map((name, locationIndex) => {
          let value = ds.data[name].absolute.current.confirmed / that.state.datasource.maxValue;
          // let value = ds.data[name].ppm.current.confirmed;
          let size = this.scale(value, Population.ABSOLUTE[name]);
          return this.marker(locationIndex, that.state.datasource.locations[name], "#F00", size, ds.data[name], name, "confirmed", 0.5);
        })
    )
  };

  recoveredMarkers = (ds) => {
    let that = this;
    return (
      this.state.momentum==="none" &&
        Object.keys(ds.data).map((name, locationIndex) => {
          let value = ds.data[name].absolute.current.recovered / that.state.datasource.maxValue;
          value += ds.data[name].absolute.current.deceased / that.state.datasource.maxValue;
          // let value = ds.data[name].ppm.current.recovered;
          let size = this.scale(value, Population.ABSOLUTE[name]);
          return this.marker(locationIndex, that.state.datasource.locations[name], "#0F0", size, ds.data[name], name, "recovered", 0.5);
        })
    )
  };

  deceasedMarkers = (ds) => {
    let that = this;
    return (
      this.state.momentum==="none" &&
        Object.keys(ds.data).map((name, locationIndex) => {
          let value = ds.data[name].absolute.current.deceased / that.state.datasource.maxValue;
          // let value = ds.data[name].ppm.current.deceased;
          let size = this.scale(value, Population.ABSOLUTE[name]);
          return this.marker(locationIndex, that.state.datasource.locations[name], "#000", size, ds.data[name], name, "deceased", 0.8);
        })
    )
  };

  marker = (index, coordinates, color, size, data, name, type, opacity) => {
    if(size > 0) {
      return (
        // bubble
        <CircleMarker
          className={type}
          key={type + "_" + index}
          style={this.state.chart === "pie" ? {display: "block"} : {display: "none"}}
          center={[coordinates[1], coordinates[0]]}
          fillColor={color}
          radius={size && size > 0 ? Math.sqrt(size) * this.state.factor : 0}
          opacity={0}
          fillOpacity={opacity}
          onClick={() => {
              this.state.selectedLocations.pop();
              this.state.selectedLocations.push(name);
              this.setState({});
          }}
        >
          <LTooltip direction="bottom" offset={[0, 20]} opacity={1}>
            {
              this.tooltip(name, data)
            }
          </LTooltip>
        </CircleMarker>
      );
    }
    return "";
  };


  tooltip = (name, data) => {
    let mode = this.state.ppmmode ? "ppm" : "absolute";
    let unit = this.state.ppmmode ? "ppm" : "";
    let containmentScore = data.containmentScore;
    if(containmentScore === null) {
      containmentScore = "N/A";
    }
    try {
      return (
        <div>
          <div>
              <b>{name}</b><br />
              <FontAwesomeIcon icon={faUsers}/> {Utils.rounded(Population.ABSOLUTE[name])}
              &nbsp;&middot;&nbsp;
              <span className={"text-warning"}>
                <FontAwesomeIcon icon={faThermometerThreeQuarters}/>&nbsp;
                {<span>{Utils.rounded(data[mode].current.confirmed)} {unit}</span>}
              </span>
              &nbsp;&middot;&nbsp;
              <span className={"text-success"}>
                <FontAwesomeIcon icon={faHeartbeat}/>&nbsp;
                {<span>{Utils.rounded(data[mode].current.recovered)} {unit}</span>}
              </span>
              &nbsp;&middot;&nbsp;
              <span className={"text-dark"}>
                <FontAwesomeIcon icon={faHeartBroken}/>&nbsp;
                {<span>{Utils.rounded(data[mode].current.deceased)} {unit}</span>}
              </span>
          </div>
          <div>
            {
              data[mode].current.confirmedProjected > data[mode].current.confirmed && this.state.testmode && this.state.testscale > 0 &&
              [
                <Badge className={"text-primary"}>
                  <FontAwesomeIcon icon={faThermometerThreeQuarters}/>&nbsp;
                  &gt;{<span>{Utils.rounded(data[mode].current.confirmedProjected * this.state.testscale)} {unit} projected at {this.state.testscale}x global avg. testing rate</span>}
                </Badge>,
                <br />
              ]
            }
            <Badge variant={"danger"}>
                <FontAwesomeIcon icon={faProcedures}/>&nbsp;
                {<span>{Utils.rounded(data[mode].current.active)} {unit} active</span>}
            </Badge>
            &nbsp;&middot;&nbsp;
            <Badge variant={"primary"}>
                <FontAwesomeIcon icon={faVial}/>&nbsp;
                { Testing.RATES[name] && <span>{(Population.ABSOLUTE[name]&&this.state.ppmmode)?Utils.rounded(Testing.RATES[name]*ONE_M/Population.ABSOLUTE[name]) +"ppm":Utils.rounded(Testing.RATES[name])} tested</span>}
                { !Testing.RATES[name] && <span>No testing data</span>}
            </Badge>
            <br/>
          </div>
          <div className="stayAtHomeScoreLabel">
            {
              [
                <span className="stayAtHomeAdvice">{this.stayAtHomeAdvice(data.absolute.current.active)}</span>,
                <br/>
              ]
            }
            <table>
              <tbody>
                <tr>
                  <td valign={"top"}>
                    <div className={`stayAtHomeScore stayAtHomeScore${containmentScore}`}>
                      {containmentScore}{containmentScore !== "N/A" ? "/10" : ""}
                    </div>
                  </td>
                  <td>
                    <div>
                      <i>Containment Score</i> reflects the spread of COVID19<br />
                      in the region, based on weighted average growth<br />
                      of confirmed cases over the past 1, 3 and 7 days.
                    </div>
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td><FontAwesomeIcon icon={faExclamationTriangle}/> <b>Continue to follow the advice of the WHO<br/>and your local administration.</b></td>
                </tr>
                {
                  this.state.ppmmode &&
                  <tr>
                    <td></td>
                    <td><span className="text-muted">ppm: confirmed cases per one million people</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <BarChart
            datasource={this.state.datasource}
            name={name}
            logmode={this.state.logmode}
            dayOffset={this.state.dayOffset}
          />
          <br />
          <div className={"text-center"}>
              Plot shows data scaled <b>{this.state.logmode ? "logarithmically" : "linearly "}</b>  over time.<br /><i>It is currently insensitive to population size.</i>
          </div>
        </div>
      )
    } catch(e) {
      console.log(e);
      return "Could not load tooltip data.";
    }
  };

  stayAtHomeAdvice = (active) => {
    if(active > 150) {
      return "You save lives by staying at home today!"
    }
    if (active > 0) {
      return "Avoid crowds! Keep social distance!";
    }
    return "No active cases detected in this region.";
  };

      /*

        <Marker coordinates={coordinates} key={type + "_" + rowId}>
          // pill
          <rect
              fill={color + transparency}
              style={this.state.chart === "pill" ? {display: "block"} : {display: "none"}}
              x={isNaN(size) ? 0 : -size * this.state.factor / 2}
              y={-this.state.width / 2 * 3}
              height={(this.state.width < 0) ? 0 : this.state.width * 3}
              width={isNaN(size) ? 0 : (size * this.state.factor > 0) ? size * this.state.factor : 0}
              onMouseOver={() => {
                if (rowId < 0) {
                  this.state.setTooltipContent(`Could not retrieve data for ${name}.`);
                } else {
                  let active = that.confirmed[rowId].val - that.recoveredAbsByRowId[rowId] - that.deathsAbsByRowId[rowId];
                  this.state.setTooltipContent(
                      <div>
                        <b>{name}</b> &nbsp;
                        <span><FontAwesomeIcon icon={faUsers}/> {rounded(Population.ABSOLUTE[name])}</span><br/>
                        <span><FontAwesomeIcon
                            icon={faThermometerThreeQuarters}/> {rounded(that.confirmed[rowId].val)} confirmed (>{rounded(that.projected[rowId].val)} at avg. test rate)</span><br/>
                        <span><FontAwesomeIcon icon={faProcedures}/> {rounded(active)} active</span>
                        &nbsp;<span><FontAwesomeIcon
                          icon={faHeartbeat}/> {rounded(that.recovered[rowId].val)} recovered</span>
                        &nbsp;<span><FontAwesomeIcon
                          icon={faHeartBroken}/> {rounded(that.deaths[rowId].val)} deceased</span>
                      </div>
                  );
                }
              }}
              onMouseOut={() => {
                this.state.setTooltipContent("");
              }}
          />

          // bar
          <rect
              fill={color + transparency}
              style={this.state.chart === "bar" ? {display: "block"} : {display: "none"}}
              x={this.state.width * 3 * 2 - this.state.width * 3 * 1.5}
              y={isNaN(size) ? 0 : -size * this.state.factor}
              height={isNaN(size) ? 0 : (size * this.state.factor < 0) ? 0 : size * this.state.factor}
              width={(this.state.width < 0) ? 0 : this.state.width * 3}
              onMouseOver={() => {
                if (rowId < 0) {
                  this.state.setTooltipContent(`Could not retrieve data for ${name}.`);
                } else {
                  let active = that.confirmed[rowId].val - that.recoveredAbsByRowId[rowId] - that.deathsAbsByRowId[rowId];
                  this.state.setTooltipContent(
                      <div>
                        <b>{name}</b> &nbsp;
                        <span><FontAwesomeIcon icon={faUsers}/> {rounded(Population.ABSOLUTE[name])}</span><br/>
                        <span><FontAwesomeIcon
                            icon={faThermometerThreeQuarters}/> {rounded(that.confirmed[rowId].val)} confirmed (>{rounded(that.projected[rowId].val)} at avg. test rate)</span><br/>
                        <span><FontAwesomeIcon icon={faProcedures}/> {rounded(active)} active</span>
                        &nbsp;<span><FontAwesomeIcon
                          icon={faHeartbeat}/> {rounded(that.recovered[rowId].val)} recovered</span>
                        &nbsp;<span><FontAwesomeIcon
                          icon={faHeartBroken}/> {rounded(that.deaths[rowId].val)} deceased</span>
                      </div>
                  );
                }
              }}
              onMouseOut={() => {
                this.state.setTooltipContent("");
              }}
          />

          // bubble
          <circle
              fill={color + transparency}
              style={this.state.chart === "pie" ? {display: "block"} : {display: "none"}}
              r={size && size > 0 ? Math.sqrt(size) * this.state.factor : 0}
              onMouseOver={() => {
                if (rowId < 0) {
                  this.state.setTooltipContent(`Could not retrieve data for ${name}.`);
                } else {
                  let active = that.confirmed[rowId].val - that.recoveredAbsByRowId[rowId] - that.deathsAbsByRowId[rowId];
                  this.state.setTooltipContent(
                      <div>
                        <b>{name}</b> &nbsp;
                        <span><FontAwesomeIcon icon={faUsers}/> {rounded(Population.ABSOLUTE[name])}</span><br/>
                        <span><FontAwesomeIcon
                            icon={faThermometerThreeQuarters}/> {rounded(that.confirmed[rowId].val)} confirmed (>{rounded(that.projected[rowId].val)} at avg. test rate)</span><br/>
                        <span><FontAwesomeIcon icon={faProcedures}/> {rounded(active)} active</span>
                        &nbsp;<span><FontAwesomeIcon
                          icon={faHeartbeat}/> {rounded(that.recovered[rowId].val)} recovered</span>
                        &nbsp;<span><FontAwesomeIcon
                          icon={faHeartBroken}/> {rounded(that.deaths[rowId].val)} deceased</span>
                      </div>
                  );
                }
              }}
              onMouseOut={() => {
                this.state.setTooltipContent("");
              }}
          />

          <title>{text}</title>
        </Marker>
      */

  scale = (value, population) => {
    value = this.scaleIfPillOrBar(value);
    value = this.scaleLog(value);
    value = this.scalePpm(value, population);
    value = this.scaleLogAndPpm(value);
    return value;
  };

  scaleIfPillOrBar = (value) => {
    if(this.state.chart==="pill" || this.state.chart==="bar") {
      return value * 10;
    }
    return value;
  };

  scaleLog = (value) => {
    if(!this.state.logmode) {
      return value;
    }
    if(value > 0) {
        value = Math.log(value * this.state.datasource.maxValue) / Math.log(this.state.datasource.maxValue) / 20;
        return value;
    }
    return 0;
  };

  scalePpm = (value, population) => {
    if(!this.state.ppmmode) {
      return value;
    }
    if(population) {
      if((value > 0) && ( population > 1000000)) {
        return 1000000 * value / population * 20;
      }
    }
    return 0;
  };

  scaleLogAndPpm = (value) => {
    if(this.state.logmode && this.state.ppmmode) {
      return value / 3;
    }
    return value;
  };

  sleep = async (msec) => {
    return new Promise(resolve => setTimeout(resolve, msec));
  };
}

export default memo(MapChart);
