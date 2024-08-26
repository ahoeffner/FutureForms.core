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
import { Session } from "./Session.js";
import { Assertion } from "./Assertion.js";
import { FilterGroup } from "./filters/FilterGroup.js";
import { Filter, NameValuePair } from "./filters/Filters.js";

export class Delete
{
   private errm$:string = null;
   private success$:boolean = true;
   private assert$:Assertion = new Assertion();

   private affected$:number = 0;
   private cursor$:Cursor = null;

   private table$:Table;
   private source$:string;
   private session$:Session;
   private savepoint$:boolean = null;
   private filter$:FilterGroup = null;
   private returning$:string[] = null;
   private assertions$:NameValuePair[] = [];


   public constructor(table:Table, filters?:Filter|Filter[]|FilterGroup|FilterGroup[])
   {
      this.table$ = table;
      this.filter$ = FilterGroup.group(filters);

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


   public affected() : number
   {
      return(this.affected$);
   }


   public getReturnValues() : Cursor
   {
      return(this.cursor$);
   }


   public getAssertionStatus() : Assertion
   {
      return(this.assert$);
   }


   public setAssertions(assertions?:NameValuePair|NameValuePair[]) : Delete
   {
      if (assertions == null)
         assertions = [];

      if (!Array.isArray(assertions))
         assertions = [assertions];

      this.assertions$ = assertions;
      return(this);
   }


   public bind(...values:any) : Delete
   {
      if (this.filter$)
         this.filter$.bind(values);

      return(this);
   }


   public useSavePoint(flag:boolean) : Delete
   {
      this.savepoint$ = flag;
      return(this);
   }


   public setReturnColumns(columns:string|string[]) : Delete
   {
      if (!Array.isArray(columns))
         columns = [columns];

      this.returning$ = columns;
      return(this);
   }


   public async execute(...values:any)  : Promise<boolean>
   {
      this.affected$ = 0;
      this.cursor$ = null;

      await this.table$.describe();

      let request:any =
      {
         "Table":
         {
            "invoke": "delete",
            "source": this.source$,
            "session": this.session$.sessionID,

            "delete()":
            {
            }
         }
      }

      if (this.table$.bindvalues)
         request.Table.bindvalues = this.table$.bindvalues;

      if (this.savepoint$ != null)
         request.Table["delete()"].savepoint = this.savepoint$;

      if (this.filter$)
      {
         if (values) this.filter$.bind(values);
         request.Table["delete()"].filters = this.filter$.parse();
      }

      if (this.returning$)
         request.Table["delete()"].returning = this.returning$;

      if (this.assertions$.length > 0)
      {
         let assrts:any = [];

         this.assertions$.forEach((nvp) =>
         {assrts.push({column: nvp.name, value: nvp.value});})

         request.Table["delete()"].assertions = assrts;
      }

      let response:any = await this.session$.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;

      if (this.success$)
         this.affected$ = response.affected;

      if (response.assertions)
         this.assert$.parse(response.assertions);

      if (this.success$ && this.returning$)
      {
         let curs:any =
         {
            more: false,
            rows: response.rows,
            columns: this.returning$
         }

         this.cursor$ = new Cursor(this.session$,this.table$.getColumnDefinitions(),curs);
      }

      return(this.success$);
   }
}