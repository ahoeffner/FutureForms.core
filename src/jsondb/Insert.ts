/*
  MIT License

  Copyright © 2023 Alex Høffner

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software
  and associated documentation files (the “Software”), to deal in the Software without
  restriction, including without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or
  substantial portions of the Software.

  THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import { Table } from "./Table.js";
import { Cursor } from "./Cursor.js";
import { Record } from "./Record.js";
import { Session } from "./Session.js";

export class Insert
{
   private errm$:string = null;
   private success$:boolean = true;

   private table$:Table;
   private source$:string;
   private session$:Session;
   private returning$:string[] = null;


   public constructor(table:Table)
   {
      this.table$ = table;
      this.source$ = this.table$.source;
      this.session$ = this.table$.session;
   }


   public failed() : boolean
   {
      return(!this.success$);
   }


   public getErrorMessage() : string
   {
      return(this.errm$);
   }


   public setReturnColumns(columns:string|string[]) : Insert
   {
      if (!Array.isArray(columns))
         columns = [columns];

      this.returning$ = columns;
      return(this);
   }


   public async execute(record:Record) : Promise<Cursor>
   {
      await this.table$.describe();

      let request:any =
      {
         "Table":
         {
            "invoke": "insert",
            "source": this.source$,
            "session": this.session$.guid,

            "insert()":
            {
            }
         }
      }

      let cols:any = [];

      for (let i = 0; i < record.columns.length; i++)
      {cols.push({column: record.columns[i], value: record.values[i]})}

      request.Table["insert()"].values = cols;

      if (this.returning$)
         request.Table["insert()"].returning = this.returning$;

      let response:any = await this.session$.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;

      if (this.success$ && this.returning$)
      {
         let curs:any =
         {
            more: false,
            rows: response.rows,
            columns: this.returning$
         }

         return(new Cursor(this.session$,this.table$.getColumnDefinitions(),curs));
      }

      return(null);
   }
}