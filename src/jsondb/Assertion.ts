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

export class Assertion
{
   private message$:string = null;
   private success$:boolean = true;
   private violations$:Violation[] = [];


   public parse(response:any) : void
   {
      this.message$ = response.record;
      this.success$ = response.success;

      if (response.violations)
      {
         response.violations.forEach((assrt) =>
         {this.violations$.push(new Violation(assrt.column,assrt.expected,assrt.actual))})
      }
   }


   public failed() : boolean
   {
      return(!this.success$);
   }


   public getErrorMessage() : string
   {
      return(this.message$);
   }


   //public getViolations() :
}


export class Violation
{
   actual$:any;
   expected$:any;
   column$:string;

   public constructor(column:string, expected:any, actual:any)
   {
      this.column$ = column;
      this.actual$ = actual;
      this.expected$ = expected;
   }


   public get column() : string
   {
      return(this.column$);
   }


   public get actual() : any
   {
      return(this.actual$);
   }


   public get expected() : any
   {
      return(this.expected$);
   }
}