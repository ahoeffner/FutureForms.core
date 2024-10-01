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

import { Session } from "./Session.js";
import { ColumnDefinition } from "./Table.js";
import { RecordDefinition, Record } from "./Record.js";


/**
 * A cursor is used for scrolling through records
 * returned by the database.
 */
export class Cursor
{
   private errm$:string = null;
   private success$:boolean = true;
   private arrayfetch$:number = null;

   private rows$:number = 0;
   private pos$:number = -1;
   private id$:string = null;
   private data$:object[][] = [];
   private more$:boolean = false;
   private columns$:string[] = null;
   private dict$:RecordDefinition = null;
   private coldef$:Map<string,ColumnDefinition> = null;


   /**
    * @param session    The JsonWebDB session
    * @param coldef     The column definitions
    * @param response   The response from JsonWebDB
    */
   constructor(private session:Session, coldef:Map<string,ColumnDefinition>, response:any)
   {
      this.coldef$ = coldef;
      this.columns$ = response.columns;

      this.id$ = response.cursor;
      this.more$ = response.more;
      this.data$ = response.rows;
      this.rows$ = this.data$.length;

      this.dict$ = new RecordDefinition(this.columns$);
   }


   /**
    * @returns Whether an error has occured
    */
   public failed() : boolean
   {
      return(!this.success$);
   }


   /**
    * @returns The error-message from the backend
    */
   public getErrorMessage() : string
   {
      return(this.errm$);
   }



   /**
    * @returns The total number of rows fetched
    */
   public fetched() : number
   {
      return(this.rows$);
   }


   /**
    * @param rows The number of rows to fetch in each roundtrip to JsonWebDB.
    * Setting it to <= 0 will force the cursor to fetch all remaining records
    * @returns
    */
   public setArrayFetch(rows:number) : Cursor
   {
      this.arrayfetch$ = rows;
      return(this);
   }


   /**
    * Checks if any rows available, and moves the pointer to the next row
    * @returns true if any rows available
    */
   public async next() : Promise<boolean>
   {
      this.pos$++;

      if (this.pos$ < this.data$.length)
      {
         let cdef:ColumnDefinition = null;

         for (let i = 0; i < this.columns$.length; i++)
         {
            cdef = this.coldef$.get(this.columns$[i].toLowerCase());

            if (cdef != null && cdef.isDate() && this.data$[this.pos$][i])
               this.data$[this.pos$][i] = new Date(""+this.data$[this.pos$][i]);
         }
      }

      if (this.pos$ < this.data$.length)
         return(true);

      if (!this.more$)
         return(false);

      let request:any =
      {
         "Cursor":
         {
            "invoke": "fetch",
            "session": this.session.sessionID,
            "cursor": this.id$
         }
      }

      if (this.arrayfetch$ != null)
      {
         request.Cursor["fetch()"] =
         {"page-size": this.arrayfetch$}

         this.arrayfetch$ = null;
      }

      let response:any = await this.session.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;

      if (response.success)
      {
         this.pos$ = -1;
         this.more$ = response.more;
         this.data$ = response.rows;
         this.rows$ += this.data$.length;

         return(this.next());
      }

      return(false);
   }


   /**
    * Fetches 'arrayfetch' rows into memory
    * If memory is not empty, it only tries the fetch the missing rows
    * @param rows The number of rows that prefetch should try to get ready for fetching
    * @returns The number of rows ready to be fetched
    */
   public async prefetch(rows?:number) : Promise<number>
   {
      if (rows == null)
         rows = this.arrayfetch$;

      let ready:number = this.data$.length - this.pos$ - 1;

      if (ready > 0)
      {
         if (rows == null && ready > 0)
            return(ready);

         if (rows != null && ready >= rows)
            return(rows);
      }

      if (!this.more$)
         return(ready);

      let request:any =
      {
         "Cursor":
         {
            "invoke": "fetch",
            "session": this.session.sessionID,
            "cursor": this.id$
         }
      }

      if (rows != null)
      {
         request.Cursor["fetch()"] =
         {"page-size": rows}
      }

      let response:any = await this.session.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;

      if (response.success)
      {
         this.more$ = response.more;
         this.rows$ += response.rows.length;

         if (ready <= 0)
         {
            this.pos$ = -1;
            this.data$ = response.rows;
         }
         else
         {
            this.data$.push(...response.rows);
         }

         return(response.rows.length + ready);
      }

      return(0);
   }


   /**
    * Closes the database cursor. This is important since the database
    * will run out of resources if cursors are never closed
    * @returns Whether the close was performed successfully
    */
   public async close() : Promise<boolean>
   {
      if (!this.more$)
         return(true);

      if (this.id$ == null)
         return(true);

      this.more$ = false;

      let request:any =
      {
         "Cursor":
         {
            "invoke": "close",
            "session": this.session.sessionID,
            "cursor": this.id$
         }
      }

      let response:any = await this.session.invoke(request);

      this.data$ = [];
      this.errm$ = response.message;
      this.success$ = response.success;

      return(response.success);
   }


   public fetch() : Record
   {
      return(new Record(this.dict$,this.data$[this.pos$]));
   }
}