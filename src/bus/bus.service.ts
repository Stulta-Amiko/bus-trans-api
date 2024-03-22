import { Injectable, Param, Query } from '@nestjs/common';
import { ChildProcess, exec, spawn } from 'child_process';

@Injectable()
export class BusTransService {
  constructor() {}

  getTest(): string {
    return 'test return';
  }

  async getBusTrans(
    @Query('depTmn') depTmn: any,
    @Query('arrTmn') arrTmn: any,
    @Query('depHour') depHour: any,
    @Query('depMin') depMin: any,
  ): Promise<string> {
    const runExternalProcess = (): Promise<string> => {
      return new Promise((resolve, reject) => {
        try {
          const child = spawn('python', [
            '../../pyparse/busroute/exec.py',
            depTmn,
            arrTmn,
            depHour,
            depMin,
          ]);

          let inside = ''; // 데이터를 저장할 변수

          child.stdout.on('data', (data) => {
            inside += data.toString(); // 데이터를 문자열로 변환하여 저장
            //console.log(`Received data: ${data}`);
          });

          child.stderr.on('data', (data) => {
            console.error(`Error data: ${data}`);
          });

          child.on('close', (code) => {
            //console.log(`Child process exited with code ${code}`);
            resolve(inside); // 데이터를 반환
          });
        } catch (e) {
          reject(e);
          return e;
        }
      });
    };

    try {
      const resultStr = await runExternalProcess();
      console.log(typeof resultStr);
      const text =
        '{"name":"John", "age":"function () {return 30;}", "city":"New York"}';
      console.log(resultStr);
      const obj = JSON.parse(resultStr);
      return obj;
    } catch (e) {
      return e;
    }
  }
}
