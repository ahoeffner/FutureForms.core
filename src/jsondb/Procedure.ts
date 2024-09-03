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
import { Messages } from "../messages/Messages.js";
import { NameValuePair } from "./filters/Filters.js";


/**
 * Procedure is the client side object that wraps the JsonWebDB Procedure object.
 * Used for calling a stored procedure.
 * This class is inherited by Function, only difference is that functions returns a value
 */
export class Procedure
{
   private errm$:string = null;
   private success$:boolean = true;

   private source$:string;
   private session$:Session;

   protected retval$:string = null;
   private savepoint$:boolean = null;

   private values$:Map<string,any> =
      new Map<string,any>();

   private parameters$:Map<string,ColumnDefinition> =
      new Map<string,ColumnDefinition>();


   /**
    * @param session    The JsonWebDB session
    * @param source     The source sql
    */
   public constructor(session:Session, source:string)
   {
      this.source$ = source;
      this.session$ = session;

      if (!source) throw Messages.get("SOURCE_IS_NULL","Procedure/Function");
      if (!session) throw Messages.get("SESSION_IS_NULL","Procedure/Function");
   }


   /**
    * The name of the source object
    */
   public get source() : string
   {
      return(this.source$);
   }


   /**
    * The JsonWebDB session
    */
   public get session() : Session
   {
      return(this.session$);
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
    * @param flag Whether to wrap the statement with a savepoint
    * @returns Itself
    */
   public useSavePoint(flag:boolean) : Procedure
   {
      this.savepoint$ = flag;
      return(this);
   }


   /**
    * @param name The name of the parameter
    * @returns the value returned by the procedure/function
    */
   public getValue(name:string) : any
   {
      return(this.values$.get(name.toLowerCase()));
   }


   /**
    * @param parameters name/value pair of the parameters to the procedure/function
    * @returns
    */
   public async execute(parameters?:NameValuePair|NameValuePair[]) : Promise<boolean>
   {
      let request:any =
      {
         "Call":
         {
            "invoke": "execute",
            "source": this.source$,
            "session": this.session$.sessionID,
            "execute()" : {}
         }
      }

      if (parameters != null)
      {
         if (!Array.isArray(parameters))
            parameters = [parameters];

         request.Call["execute()"].bindvalues = parameters;
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

            if (parameter.isDate() && parm.value)
               parm.value = new Date(""+parm.value);

            this.values$.set(parm.name.toLowerCase(),parm.value);
            this.parameters$.set(parm.name.toLowerCase(),parameter);
         })

         this.retval$ = response.returns;
      }

      return(this.success$);
   }
}