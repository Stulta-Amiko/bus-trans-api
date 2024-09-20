import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import 'dotenv/config';
import { Injectable, Param, Query } from '@nestjs/common';

class Graph<T> {
  private nodes: Map<T, Map<T, number>> = new Map();

  // 노드 추가
  addNode(node: T) {
    if (!this.nodes.has(node)) {
      this.nodes.set(node, new Map());
    }
  }

  isNode(node: T) {
    if (this.nodes.has(node)) {
      return true;
    } else {
      return false;
    }
  }

  getEdge(from: T, to: T): string {
    return this.nodes.get(from).get(to).toString();
  }

  // 엣지 추가
  addEdge(from: T, to: T, weight: number) {
    this.addNode(from);
    this.addNode(to);
    this.nodes.get(from)?.set(to, weight);
    this.nodes.get(to)?.set(from, weight);
  }

  // simplepath 함수 구현
  simplepath(start: T, end: T, cutoff: number): T[][] {
    const result: T[][] = [];
    const visited: Set<T> = new Set();

    const dfs = (node: T, path: T[], edgeCount: number) => {
      if (edgeCount === cutoff) {
        if (node === end) {
          result.push([...path, node]);
        }
        return;
      }

      visited.add(node);
      path.push(node);

      const neighbors = this.nodes.get(node)?.keys() || [];

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, path, edgeCount + 1);
        }
      }

      visited.delete(node);
      path.pop();
    };

    dfs(start, [], 0);
    return result;
  }
}

const dataPath = process.env.DATA_PATH;

@Injectable()
export class BusNavSerivce {
  constructor() {}
  csvReader(csvPath: string): Promise<object[]> {
    let data = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.resolve(csvPath))
        .pipe(csv.parse())
        .on('error', (error) => reject(error))
        .on('data', (row) => {
          data.push(row);
        })
        .on('end', (rowCount) => {
          resolve(data);
        });
    });
  }

  async addData(graph: Graph<string>, busClass: string) {
    let firstidxpass = 0;

    await this.csvReader(`${dataPath}/data/${busClass}_Bus_Route_Detailed.csv`)
      .then((res: object[]) => {
        res.map((item) => {
          if (firstidxpass == 0) {
            firstidxpass += 1;
          } else {
            graph.addEdge(item[2], item[4], item[5]);
          }
        });
      })
      .catch((e) => console.error(e));
  }

  isFile(path) {
    let isFileExist = false;

    try {
      isFileExist = fs.lstatSync(path).isFile();
    } catch (e) {
      if (e.code == 'ENOENT') {
        //no such file or directory
        //do something
        isFileExist = false;
      } else {
        console.log('internal error');
        isFileExist = false;
        //do something else
      }
    }

    return isFileExist;
  }

  sortPath(graph: Graph<string>, result, depTmn: string, arrTmn: string) {
    let cutoff = 0;
    let cnt = 0;
    let deleteidx = [];
    let newResult = [];
    while (cutoff < 5) {
      const path = graph.simplepath(depTmn, arrTmn, cutoff);

      if (path.length === 0) {
        cutoff++;
        continue;
      } else {
        path.map((item) => {
          let triptime: number = 0;
          for (let i = 0; i < item.length - 1; i++) {
            triptime += parseInt(graph.getEdge(item[i], item[i + 1]));
          }
          item.push(triptime.toString());
        });
        path.sort(
          (a, b) => parseInt(a[a.length - 1]) - parseInt(b[b.length - 1]),
        );
        path.map((item) => {
          if (cnt < 20) {
            result.push(item);
          }
          cnt++;
        });
        if (cnt >= 20) {
          break;
        } else {
          cutoff++;
        }
      }
    }

    result.map((item: object[], idx: number) => {
      let len = item.length;
      let busType = [];
      for (let i = 0; i < len - 2; i++) {
        if (
          this.isFile(
            `${dataPath}/data/exp_each/${item[i]}/${item[i + 1]}_TimeTable.csv`,
          )
        ) {
          busType.push(item[i], item[i + 1], 'exp');
        } else if (
          this.isFile(
            `${dataPath}/data/int_each/${item[i]}/${item[i + 1]}_TimeTable.csv`,
          )
        ) {
          busType.push(item[i], item[i + 1], 'int');
        } else {
          if (!deleteidx.includes(idx)) {
            deleteidx.push(idx);
          }
        }
      }
      busType.push(item[len - 1]);
      newResult.push(busType);
    });
    deleteidx = deleteidx.reverse();
    deleteidx.map((item) => {
      newResult.splice(item, 1);
    });
    return newResult;
  }

  async navigate(
    depTmn: string,
    arrTmn: string,
    depHour: number,
    depMin: number,
  ) {
    console.time('측정시작');
    const graph = new Graph<string>();

    await this.addData(graph, 'Express');
    await this.addData(graph, 'Intercity');

    let result = [];
    let finalRoute = [];
    let deleted = [];

    if (!graph.isNode(depTmn) || !graph.isNode(arrTmn)) {
      return [
        {
          message: '출발/도착 터미널 이름에 오류가 있습니다.',
        },
      ];
    }

    result = this.sortPath(graph, result, depTmn, arrTmn);

    for (let routeIdx = 0; routeIdx < result.length; routeIdx++) {
      let len = result[routeIdx].length;
      let midHour = depHour;
      let midMin = depMin;
      let template = [
        {
          totalTime: 0,
          transferTime: 0,
          transferCount: 0,
        },
        { route: [] },
      ];
      for (let i = 0; i < (len - 1) / 3; i++) {
        const read: object[] = await this.csvReader(
          `${dataPath}/data/${result[routeIdx][i * 3 + 2]}_each/${result[routeIdx][i * 3]}/${result[routeIdx][i * 3 + 1]}_TimeTable.csv`,
        );
        read.shift();
        if (read.length === 0) {
          if (!deleted.includes(routeIdx)) {
            deleted.push(routeIdx);
          }
          break;
        }
        for (let csvIdx = 0; csvIdx < read.length; csvIdx++) {
          if (i === 0) {
            if (
              midHour < parseInt(read[csvIdx][3]) ||
              (midHour === parseInt(read[csvIdx][3]) &&
                midMin < parseInt(read[csvIdx][4]))
            ) {
              if (parseInt(read[csvIdx][3]) > parseInt(read[csvIdx][7])) {
                template[0].totalTime +=
                  (parseInt(read[csvIdx][7]) + 24 - parseInt(read[csvIdx][3])) *
                  60;
                if (parseInt(read[csvIdx][4]) > parseInt(read[csvIdx][8])) {
                  template[0].totalTime -= 60;
                  template[0].totalTime +=
                    parseInt(read[csvIdx][8]) + 60 - parseInt(read[csvIdx][4]);
                } else {
                  template[0].totalTime +=
                    parseInt(read[csvIdx][8]) - parseInt(read[csvIdx][4]);
                }
              } else {
                template[0].totalTime += parseInt(read[csvIdx][9]);
              }

              template[1].route.push({
                count: 0,
                busType: result[routeIdx][i * 3 + 2],
                depTmn: result[routeIdx][i * 3],
                arrTmn: result[routeIdx][i * 3 + 1],
                depHour: read[csvIdx][3],
                depMin: read[csvIdx][4],
                arrHour: read[csvIdx][7],
                arrMin: read[csvIdx][8],
              });
              midHour = read[csvIdx][7];
              midMin = read[csvIdx][8];
              break;
            }

            if (read.length - 1 === csvIdx) {
              if (!deleted.includes(routeIdx)) {
                deleted.push(routeIdx);
              }
            }
          } else {
            if (
              midHour < parseInt(read[csvIdx][3]) ||
              (midHour === parseInt(read[csvIdx][3]) &&
                midMin < parseInt(read[csvIdx][4]))
            ) {
              let subTime =
                (parseInt(read[csvIdx][3]) - midHour) * 60 +
                parseInt(read[csvIdx][4]) -
                midMin;
              if (subTime < 10) {
                console.log('continue');
                if (read.length - 1 === csvIdx) {
                  if (!deleted.includes(routeIdx)) {
                    deleted.push(routeIdx);
                  }
                }
                continue;
              }

              if (parseInt(read[csvIdx][3]) > parseInt(read[csvIdx][7])) {
                template[0].totalTime +=
                  (parseInt(read[csvIdx][7]) + 24 - parseInt(read[csvIdx][3])) *
                  60;
                if (parseInt(read[csvIdx][4]) > parseInt(read[csvIdx][8])) {
                  template[0].totalTime -= 60;
                  template[0].totalTime +=
                    parseInt(read[csvIdx][8]) + 60 - parseInt(read[csvIdx][4]);
                } else {
                  template[0].totalTime +=
                    parseInt(read[csvIdx][8]) - parseInt(read[csvIdx][4]);
                }
              } else {
                template[0].totalTime += parseInt(read[csvIdx][9]);
              }

              template[0].totalTime += subTime;
              template[0].transferCount = i;
              template[0].transferTime += subTime;
              template[1].route.push({
                count: i,
                busType: result[routeIdx][i * 3 + 2],
                depTmn: result[routeIdx][i * 3],
                arrTmn: result[routeIdx][i * 3 + 1],
                depHour: read[csvIdx][3],
                depMin: read[csvIdx][4],
                arrHour: read[csvIdx][7],
                arrMin: read[csvIdx][8],
              });
              midHour = read[csvIdx][7];
              midMin = read[csvIdx][8];
              break;
            }

            if (read.length - 1 === csvIdx) {
              if (!deleted.includes(routeIdx)) {
                deleted.push(routeIdx);
              }
            }
          }
        }
      }
      finalRoute.push(template);
    }
    if (deleted.length > 0) {
      deleted = deleted.reverse();

      deleted.map((item) => {
        finalRoute.splice(item, 1);
      });
    }

    finalRoute.sort(
      (a, b) => parseInt(a[0].totalTime) - parseInt(b[0].totalTime),
    );

    console.timeEnd('측정시작');
    return finalRoute;
  }
}
