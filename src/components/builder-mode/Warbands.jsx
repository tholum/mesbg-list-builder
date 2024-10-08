import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Stack from "react-bootstrap/Stack";
import { FaPlus } from "react-icons/fa";
import { HiDuplicate } from "react-icons/hi";
import { MdDelete } from "react-icons/md";
import { v4 as uuid } from "uuid";
import hero_constraint_data from "../../assets/data/hero_constraint_data.json";
import { useStore } from "../../state/store";
import {
  handleSpecialArmyOption,
  handleSpecialWarbandOption,
} from "../../utils/specialRules.js";
import { ChooseHeroButton } from "./hero/ChooseHeroButton.jsx";
import { WarbandHero } from "./hero/WarbandHero.jsx";
import { ChooseWarriorButton } from "./warrior/ChooseWarriorButton.jsx";
import { WarbandWarrior } from "./warrior/WarbandWarrior.jsx";

/* Displays the list of all warbands, and also defines how each warband card looks. */

export function Warbands({
  setHeroSelection,
  setDisplaySelection,
  setWarbandNumFocus,
  specialArmyOptions,
  setSpecialArmyOptions,
  setNewWarriorFocus,
  setTabSelection,
  factionSelection,
  setFactionSelection,
}) {
  const { roster, setRoster } = useStore();

  const handleNewWarband = () => {
    // Create a new empty warband dictionary and add to the roster
    let newRoster = { ...roster };
    let newWarband = {
      id: uuid(),
      num: newRoster.warbands.length + 1,
      points: 0,
      num_units: 0,
      max_units: "-",
      bow_count: 0,
      hero: null,
      units: [],
    };
    newRoster.warbands.push(newWarband);
    setRoster(newRoster);
    setDisplaySelection(false);
  };

  const handleCopyWarband = (warbandNum) => {
    // Create a copy of an existing warband dictionary and add to the roster
    let newRoster = { ...roster };
    let newWarband = { ...roster.warbands[warbandNum - 1] };
    newWarband["id"] = uuid();
    newWarband["num"] = roster.warbands.length + 1;
    if (newWarband.hero) {
      let newHero = { ...newWarband.hero };
      newHero["id"] = uuid();
      newWarband.hero = newHero;
      if (newWarband.hero.unique) {
        newWarband["points"] =
          newWarband["points"] - newWarband.hero["pointsTotal"];
        if (!newWarband.hero.model_id.includes("mumak_war_leader")) {
          newWarband["num_units"] =
            newWarband["num_units"] -
            (newWarband.hero.siege_crew > 0
              ? newWarband.hero.siege_crew - 1
              : 0);
        }
        newWarband.hero = null;
      } else {
        newRoster["num_units"] = newRoster["num_units"] + 1;
        if (
          newWarband.hero &&
          (newWarband.hero.model_id.includes("_mumak_") ||
            newWarband.hero.model_id.includes("great_beast_"))
        ) {
          newRoster["num_units"] = newRoster["num_units"] + 1;
        }
      }
    }
    let newUnits = newWarband.units.map((_unit) => {
      let newUnit = { ..._unit };
      newUnit["id"] = uuid();
      if (newUnit.unique) {
        newWarband["points"] = newWarband["points"] - newUnit["pointsTotal"];
        newWarband["num_units"] =
          newWarband["num_units"] -
          (newUnit.siege_crew ? newUnit.siege_crew : 1) * newUnit["quantity"];
        newWarband["bow_count"] =
          newWarband["bow_count"] -
          (newUnit["inc_bow_count"] ? 1 : 0) * newUnit["quantity"];
        return { id: uuid(), name: null };
      }
      return newUnit;
    });
    newUnits = newUnits.filter((u) => u.name != null);
    newWarband.units = newUnits;
    newRoster.warbands.push(newWarband);
    newRoster["points"] = newRoster["points"] + newWarband["points"];
    newRoster["bow_count"] = newRoster["bow_count"] + newWarband["bow_count"];
    newRoster["num_units"] = newRoster["num_units"] + newWarband["num_units"];

    newRoster = handleSpecialWarbandOption(newRoster, newWarband["num"]);
    setRoster(newRoster);
    setDisplaySelection(false);
  };

  const handleDeleteWarband = (warbandNum) => {
    let newRoster = { ...roster };
    let model_ids = newRoster.warbands[warbandNum - 1].units.map(
      (data) => data.model_id,
    );
    if (newRoster.warbands[warbandNum - 1].hero) {
      model_ids.push(newRoster.warbands[warbandNum - 1].hero.model_id);
    }

    // Update state variable if the deleted model provided a special army-wide option
    let hero = newRoster.warbands[warbandNum - 1].hero;
    if (
      hero &&
      hero_constraint_data[hero.model_id] &&
      hero_constraint_data[hero.model_id][0]["special_army_option"] !== ""
    ) {
      let newSpecialArmyOptions = specialArmyOptions.filter(
        (data) =>
          data !==
          hero_constraint_data[
            newRoster.warbands[warbandNum - 1].hero.model_id
          ][0]["special_army_option"],
      );
      newRoster = handleSpecialArmyOption(newRoster, warbandNum);
      setSpecialArmyOptions(newSpecialArmyOptions);
    }

    // Substract the warband's points, bows and unit counts from the overall roster
    newRoster.warbands.map((warband) => {
      if (warband.num === warbandNum) {
        newRoster["points"] = newRoster["points"] - warband["points"];
        newRoster["bow_count"] = newRoster["bow_count"] - warband["bow_count"];

        // Bit of awkward logic here for siege engines where the whole siege crew needs to be removed from unit count.
        if (warband.hero && warband.hero.unit_type === "Siege Engine") {
          newRoster["num_units"] =
            newRoster["num_units"] - warband.hero.siege_crew;
          warband.hero.options.map((option) => {
            if (option.option === "Additional Crew") {
              newRoster["num_units"] =
                newRoster["num_units"] - option.opt_quantity;
            }
            return null;
          });
        } else {
          newRoster["num_units"] =
            newRoster["num_units"] -
            warband["num_units"] -
            (warband.hero != null ? 1 : 0);
          if (
            warband.hero &&
            (warband.hero.model_id.includes("_mumak_") ||
              warband.hero.model_id.includes("great_beast_"))
          ) {
            newRoster["num_units"] = newRoster["num_units"] - 1;
          }
        }
      }
      return null;
    });

    // Remove the warband from the roster, and for all warbands that appear below the one being deleted, shift their warband number down by 1
    let newWarbands = newRoster.warbands.filter(
      (data) => data.num !== warbandNum,
    );
    newWarbands = newWarbands.map((warband) => {
      let newWarband = { ...warband };
      if (warband.num > warbandNum) {
        newWarband["num"] = newWarband["num"] - 1;
      }
      return newWarband;
    });
    newRoster.warbands = newWarbands;
    if (newRoster["leader_warband_num"] === warbandNum) {
      newRoster["leader_warband_num"] = null;
    }
    setRoster(newRoster);
    setDisplaySelection(false);
  };

  const handleNewWarrior = (warbandNum) => {
    // Add an empty placeholder dictionary for the new unit (it will be replaced by the actual warrior that gets selected)
    let newRoster = { ...roster };
    newRoster.warbands[warbandNum - 1].units.push({ id: uuid(), name: null });
    setRoster(newRoster);
    setHeroSelection(false);
    setDisplaySelection(false);
  };

  return (
    <Stack style={{ marginLeft: "535px" }} gap={3}>
      {roster.warbands.map((warband) => (
        <Card
          key={uuid()}
          style={{ width: "850px" }}
          className="p-2 shadow"
          bg="secondary"
          text="light"
        >
          <Stack direction="horizontal">
            {warband.hero ? (
              <Card.Text className="ms-2" style={{ fontSize: 20 }}>
                <Badge bg="dark">{warband.hero.faction}</Badge>
              </Card.Text>
            ) : (
              <Card.Text className="ms-2" style={{ fontSize: 20 }}>
                <Badge bg="dark">[Faction]</Badge>
              </Card.Text>
            )}
            <Card.Text className="ms-4">
              Warband: <b>{warband.num}</b>
            </Card.Text>
            <Card.Text
              className={
                warband.num_units > warband.max_units
                  ? "ms-4 text-warning"
                  : "ms-4"
              }
            >
              Units:{" "}
              <b>
                {warband.num_units} / {warband.max_units}
              </b>
            </Card.Text>
            <Card.Text className="ms-4">
              Points: <b>{warband.points}</b>
            </Card.Text>
            <Button
              onClick={() => handleCopyWarband(warband.num)}
              className="mt-1 ms-auto mb-2"
              style={{ marginRight: "10px" }}
              variant="info"
            >
              <HiDuplicate />
            </Button>
            <Button
              onClick={() => handleDeleteWarband(warband.num)}
              className="mt-1 mb-2"
              style={{ marginRight: "10px" }}
              variant="danger"
            >
              <MdDelete />
            </Button>
          </Stack>
          {warband.hero == null ? (
            <ChooseHeroButton
              key={uuid()}
              setHeroSelection={setHeroSelection}
              setDisplaySelection={setDisplaySelection}
              warbandNum={warband.num}
              setWarbandNumFocus={setWarbandNumFocus}
            />
          ) : (
            <WarbandHero
              key={uuid()}
              warbandNum={warband.num}
              unitData={warband.hero}
              specialArmyOptions={specialArmyOptions}
              setSpecialArmyOptions={setSpecialArmyOptions}
            />
          )}
          {warband.units.length > 0 &&
            warband.units.map((unit) =>
              unit.name == null ? (
                <ChooseWarriorButton
                  key={uuid()}
                  setNewWarriorFocus={setNewWarriorFocus}
                  unitData={unit}
                  setHeroSelection={setHeroSelection}
                  setDisplaySelection={setDisplaySelection}
                  warbandNum={warband.num}
                  setWarbandNumFocus={setWarbandNumFocus}
                  setTabSelection={setTabSelection}
                  factionSelection={factionSelection}
                  setFactionSelection={setFactionSelection}
                />
              ) : (
                <WarbandWarrior
                  key={uuid()}
                  warbandNum={warband.num}
                  unitData={unit}
                  specialArmyOptions={specialArmyOptions}
                />
              ),
            )}
          {warband.hero != null &&
            !["Independent Hero", "Independent Hero*", "Siege Engine"].includes(
              warband.hero.unit_type,
            ) &&
            warband.hero.model_id !==
              "[erebor_reclaimed_(king_thorin)] iron_hills_chariot_(champions_of_erebor)" &&
            warband.hero.model_id !== "[desolator_of_the_north] smaug" && (
              <Button
                onClick={() => handleNewWarrior(warband.num)}
                variant="info"
                className="m-1"
                style={{ width: "820px" }}
              >
                Add Unit <FaPlus />
              </Button>
            )}
        </Card>
      ))}
      <Button onClick={() => handleNewWarband()} style={{ width: "850px" }}>
        Add Warband <FaPlus />
      </Button>
    </Stack>
  );
}
