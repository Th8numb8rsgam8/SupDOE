import re
import os
import pdb
import json
import shutil
import subprocess
import numpy as np
import pandas as pd
from pyDOE import lhs


class Suppressor_DOE():


    def __init__(self, sample_size=10):
        self.sample_size = sample_size
        self.__exp_docs = [] 
        self.__exp_inputs = {}
        self.__design_points = None
        self._progress = 0


    def __set_player_data(self, scenario_data):

        plr_sets = scenario_data["Players"]
        for set_number in plr_sets:
            player_matrix = self.__set_players(plr_sets[set_number]) 
            for index, player_names in enumerate(plr_sets[set_number]["set"]):
                for player_name in player_names:
                    scenario_data["Variable Data"][player_name]["values"].append(player_matrix[:,index])


    def __set_players(self, player_set):

        player_matrix = np.random.uniform(size=(self.sample_size, len(player_set["set"])))
        num_players = np.random.randint(
            player_set["limits"][0], 
            player_set["limits"][1]+1, 
            size=self.sample_size)

        for index, row in enumerate(player_matrix):
            sorted_indices = np.argsort(row) 
            row[sorted_indices[:num_players[index]]] = int(1)
            row[sorted_indices[num_players[index]:]] = int(0)

        return player_matrix 


    def __assign_categories(self, design_point, normalized_list):

        for value, category in normalized_list: 
            if design_point <= value:

                return category


    def build_run_experiment(self, exp_docs):

        self.__exp_docs = exp_docs
        self.__collect_player_data()
        self.__generate_design_points()
        self.__execute_DOE()


    def __generate_design_points(self):

        col_names = [zip(
            [doc] * len(self.__exp_inputs[doc]["Variable Data"].keys()),
            list(self.__exp_inputs[doc]["Variable Data"].keys()))
                     for doc in self.__exp_inputs]
        col_names = [list(i) for i in col_names]
        cols = []
        for i in col_names:
            cols.extend(i)

        design_matrix = lhs(len(cols),samples=self.sample_size,criterion="center")
        self.__design_points = pd.DataFrame(
            columns=pd.MultiIndex.from_tuples(cols), 
            data=design_matrix)

        for doc in self.__exp_inputs:
            self.__set_player_data(self.__exp_inputs[doc])

        for doc, var in self.__design_points:
            var_type = self.__exp_inputs[doc]["Variable Data"][var]["type"]
            if var_type == "categorical":
                category_list = list(self.__exp_inputs[doc]["Variable Data"][var]["values"].keys())
                num_treatments = len(category_list)
                normalized_list = [((i + 1)/num_treatments, category_list[i]) for i in range(num_treatments)]
                var_categories = self.__design_points[doc][var].apply(lambda x: self.__assign_categories(x, normalized_list))
                self.__design_points[(doc, var)] = var_categories

            elif var_type == "continuous": 
                var_limits = self.__exp_inputs[doc]["Variable Data"][var]["values"]
                values = self.__design_points[doc][var].apply(lambda x: x * (var_limits[1] - var_limits[0]) + var_limits[0])
                self.__design_points[(doc, var)] = values

            elif var_type == "integer":
                var_limits = self.__exp_inputs[doc]["Variable Data"][var]["values"]
                values = self.__design_points[doc][var].apply(lambda x: int( 
                    round(x * (var_limits[1] - var_limits[0]) + var_limits[0])))
                self.__design_points[(doc, var)] = values

            elif var_type == "player":
                plr_sets = self.__exp_inputs[doc]["Variable Data"][var]["values"]
                result = np.ones(self.sample_size)
                for array in plr_sets:
                    result *= array
                self.__design_points[(doc, var)] = result


    def collect_file_data(self, scenario_file):

        with open(scenario_file) as file:

            lines = file.read()
            variable_capture = re.compile("(?<=@{)([\w\s-]*?)(?=}@)")
            player_pattern = re.compile("(?<=PLAYER:)\s*\d*\s*\w*")
            doe_parameters = {"Variable Data": {}, "Players": []}
            variable_names = re.findall(variable_capture, lines)
            scenario_players = re.findall(player_pattern, lines)
            for var_name in variable_names:
                doe_parameters["Variable Data"][var_name] = {}
                doe_parameters["Variable Data"][var_name]["type"] = None
                doe_parameters["Variable Data"][var_name]["values"] = []

            for player in scenario_players:
                doe_parameters["Players"].append(player.strip()) 

        return doe_parameters


    def __collect_player_data(self):

        for docs in self.__exp_docs: 
            doc = docs["doc"]
            exp = docs["exp"]
            with open(exp) as file:
                self.__exp_inputs[doc] = json.load(file)

            with open(doc) as file:
                lines = file.readlines()
                player_pattern = re.compile("(?<=PLAYER:)\s*\d*\s*\w*")

                for idx, line in enumerate(lines):
                    player = re.search(player_pattern, line)
                    if player:
                        plr = player.group().strip()
                        for plr_idx, line in enumerate(lines[idx:]):
                            if "END PLAYER" in line:
                                self.__exp_inputs[doc]["Variable Data"][plr] = {}
                                self.__exp_inputs[doc]["Variable Data"][plr]["type"] = "player"
                                self.__exp_inputs[doc]["Variable Data"][plr]["values"] = []
                                self.__exp_inputs[doc]["Variable Data"][plr]["rows"] = (idx, idx+plr_idx)
                                break


    def __execute_DOE(self):

        exec_dir = os.path.join(os.getcwd(), "exec_dir")
        if not os.path.exists(exec_dir):
            os.makedirs(os.path.join(exec_dir, "tdb"))
            os.makedirs(os.path.join(exec_dir, "sdb"))

        docs = list(self.__exp_inputs.keys())

        src_tmp = {} 
        for doc in docs:
            doc_elements = os.path.split(doc)
            doc_type = os.path.split(doc_elements[0])[1]
            tmp_doc = os.path.join(exec_dir, doc_type, doc_elements[1])
            src_tmp[doc] = {}
            src_tmp[doc]["tmpdir"] = tmp_doc 

            with open(doc, "r") as file:
                lines = file.readlines()
                src_tmp[doc]["content"] = lines
            shutil.copy(doc, tmp_doc)

        for idx, dp, in self.__design_points.iterrows():
            for doc in src_tmp:
                lines = src_tmp[doc]["content"]

                for variable in self.__exp_inputs[doc]["Variable Data"]:
                    var = self.__exp_inputs[doc]["Variable Data"][variable]
                    if var["type"] == "player":
                        row_start, row_end = var["rows"]
                        plr_presence = dp[(doc, variable)]
                        if plr_presence:
                            lines[row_start:row_end+1] = map(self.__add_player, 
                                                             lines[row_start:row_end+1])
                        if not plr_presence:
                            lines[row_start:row_end+1] = map(self.__remove_player, 
                                                             lines[row_start:row_end+1])

                lines = "".join(lines)
                for variable in self.__exp_inputs[doc]["Variable Data"]:
                    var = self.__exp_inputs[doc]["Variable Data"][variable]
                    if var["type"] == "player":
                        continue
                    elif var["type"] == "categorical":
                        lines = lines.replace(
                            "@{"+str(variable)+"}@",
                            str(var["values"][dp[(doc, variable)]]))
                    elif var["type"] == "continuous":
                        lines = lines.replace(
                            "@{"+str(variable)+"}@",
                            str(round(dp[(doc, variable)],3)))
                    else: # var["type"] == "integer"
                        lines = lines.replace(
                            "@{"+str(variable)+"}@",
                            str(dp[(doc, variable)]))

                with open(os.path.join(os.getcwd(), "test_doc.dat"), "w") as file:
                    file.write(lines)

                print(f"{doc} changed!")

                self._progress = round(((idx + 1) / self.sample_size) * 100)


    def get_progress(self):

        return self._progress

 
    def __remove_player(self, line):

        return "$ " + re.sub("^\$\s","", line)


    def __add_player(self, line):

        return re.sub("^\$\s","", line) 


if __name__ == "__main__":

    DOE = Suppressor_DOE()

    scenario_directory = os.path.join(os.getcwd(),"DOE")
    exp_assets = ["tdb/laser_tdb.dat", "sdb/laser_sdb.dat"]

    docs = [doc.split("/") for doc in exp_assets]
    doc_paths = [os.path.join(
        scenario_directory, 
        doc[0], 
        doc[1]) for doc in docs]

    exp_paths = [os.path.join(
        scenario_directory, 
        "experiment_inputs", 
        doc[0], 
        doc[1].replace(".dat",".json")) for doc in docs]

    exp_docs = [{"doc": doc, "exp": exp} for doc, exp in zip(doc_paths, exp_paths)]

    DOE.build_run_experiment(exp_docs)

    pdb.set_trace()

    sample_size = 20

    # experiment_inputs = {}
    # for idx, doc, exp in zip(docs, doc_paths, exp_paths):
    #     if idx[0] == "sdb":
    #         experiment_inputs[doc] = DOE.collect_player_data(doc, exp)
    #     else:
    #         f = open(exp)
    #         experiment_inputs[doc] = json.load(f)
    #         f.close()
            
    # design_points = DOE.generate_design_points(experiment_inputs)
    # DOE.execute_DOE(design_points, experiment_inputs)
