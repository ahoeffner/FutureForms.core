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
import { NameValuePair } from "./filters/Filters.js";


export class Procedure
{
   private errm$:string = null;
   private success$:boolean = true;

   private source$:string;
   private session$:Session;

   protected retval$:string = null;
   private savepoint$:boolean = null;

   private values$:Map<string,ColumnDefinition> =
      new Map<string,ColumnDefinition>();


   public constructor(session:Session, source:string)
   {
      this.source$ = source;
      this.session$ = session;
   }


   public failed() : boolean
   {
      return(!this.success$);
   }


   public getErrorMessage() : string
   {
      return(this.errm$);
   }


   public useSavePoint(flag:boolean) : Procedure
   {
      this.savepoint$ = flag;
      return(this);
   }


   public getValue(name:string) : any
   {
      return(this.values$.get(name.toLowerCase()));
   }


   public async execute(parameters?:NameValuePair|NameValuePair[]) : Promise<boolean>
   {
      let request:any =
      {
         "Call":
         {
            "invoke": "execute",
            "source": this.source$,
            "session": this.session$.guid
         }
      }

      if (parameters != null)
      {
         if (!Array.isArray(parameters))
            parameters = [parameters];

         request.Call.bindvalues = parameters;
      }

      if (this.savepoint$ != null)
         request.Call["execute()"].savepoint = this.savepoint$;

      let response:any = await this.session$.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;
      let parameter:ColumnDefinition = null;

      if (this.success$)
      {
         response.values?.forEach((parm) =>
         {
            parameter = new ColumnDefinition();

            parameter.name = parm.name;
            parameter.type = parm.type;
            parameter.sqltype = parm.sqltype;
            parameter.precision = parm.precision;

            this.values$.set(parm.name.toLowerCase(),parameter);
         })

         this.retval$ = response.returns;
      }

      return(this.success$);
   }
}