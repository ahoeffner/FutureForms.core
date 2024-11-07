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


/**
 * The session object is the client side part of a JsonWebDB session.
 * JsonWebDB is stateful and holds information for each session (authentication etc).
 */
export class Session
{
   public static KEEPALIVE_MIN = 32;
   public static KEEPALIVE_SLACK = 8;

   private errm$:string = null;
   private success$:boolean = true;

   private url$:URL = null;
   private guid$:string = null;

   private last$:Object = null;
   private timeout$:number = 0;

   private vpd$:{name:string, value:object}[] = [];
   private clientinfo$:{name:string, value:object}[] = [];


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
    * The url that points to JsonWebDB
    */
   public get url() : URL
   {
      let url:URL = this.url$;

      if (url == null)
			url = new URL(window.location.origin);

      return(url);
   }


   /**
    * The url that points to JsonWebDB
    */
   public set url(url:URL|string)
   {
      if (typeof url === "string")
			url = new URL(url);

      this.url$ = url;
   }


   /**
    * The unique id used by JsonWebDB
    */
   public get sessionID() : string
   {
      return(this.guid$);
   }


   /**
    * Virtual Private Database lets you add a where-clause
    * whenever querying specific tables (defined in the backend)
    * @param name The name/column used in the backend where-clause
    * @param value This sessions value for the name/column
    */
   public addVPDContext(name:string, value:any) : void
   {
      this.vpd$.push({name: name, value: value});
   }


   /**
    * Some databases can use ClientInfo (check with your database documentation)
    * @param name The name of the client-info
    * @param value The value
    */
   public addClientInfo(name:string, value:any) : void
   {
      this.clientinfo$.push({name: name, value: value});
   }


   /**
    * Connect to JsonWebDB
    * @param username   The username
    * @param password   A password
    * @param stateful   Whether the session should use a dedicated database connection
    * @returns Whether the connect was successfully
    */
   public async connect(username?:string, password?:string, stateful?:boolean) : Promise<boolean>
   {
      if (stateful == null)
         stateful = false;

      let request:any =
      {
         "Session":
         {
            "invoke": "connect()",

            "connect()":
            {
               "stateful": stateful
            }
         }
      }

		if (username)
			request.Session["connect()"].username = username;

		if (password)
			request.Session["connect()"].password = password;

      if (this.vpd$.length > 0)
         request.Session["connect()"].vpd = this.vpd$;

      if (this.clientinfo$.length > 0)
         request.Session["connect()"]["client-info"] = this.clientinfo$;

      let response:any = await this.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;

      if (response.success)
      {
         this.vpd$ = [];
         this.clientinfo$ = [];

         this.guid$ = response.session;
         this.timeout$ = response.timeout;

         if (this.timeout$ < Session.KEEPALIVE_MIN)
            throw "KEEPALIVE < KEEPALIVE_MIN";

         this.timeout$ -= Session.KEEPALIVE_SLACK;

         this.timeout$ *= 1000;
         this.last$ = KeepAlive.next(this,this.timeout$);
      }

      return(response.success);
   }


   /**
    * Disconnect from JsonWebDB
    * @returns Whether the disconnect was successfully
    */
   public async disconnect() : Promise<boolean>
   {
      if (this.guid$ == null)
         return(false);

      let guid:string = this.guid$;

      let request:any =
      {
         "Session":
         {
            "session": this.guid$,
            "invoke": "disconnect()",
         }
      }

      this.guid$ = null;

      try {await this.invoke(request);}
      catch (error) {this.guid$ = guid; return(false)}

      return(true);
   }


   /**
    * Sets VPD and ClientInfo.
    * @returns Whether the properties was applied successfully
    */
   public async setProperties() : Promise<boolean>
   {
      let request:any =
      {
         "Session":
         {
				"session": this.guid$,
            "invoke": "properties()",

            "properties()":
            {
            }
         }
      }

      if (this.vpd$.length > 0)
         request.Session["properties()"].vpd = this.vpd$;

      if (this.clientinfo$.length > 0)
         request.Session["properties()"]["client-info"] = this.clientinfo$;

      let response:any = await this.invoke(request);

      if (response.success)
      {
         this.vpd$ = [];
         this.clientinfo$ = [];
      }

      return(response.success);
   }


   private async keepalive(next:Object) : Promise<void>
   {
      if (this.guid$ == null)
         return;

      if (next != this.last$)
         return;

      let request:any =
      {
         "Session":
         {
            "session": this.guid$,
            "invoke": "keepalive()",
         }
      }

      await this.invoke(request);
   }


   /**
    * Sends the payload to JsonWebDB
    * @param payload Any data
    * @param path A uri-path
    * @returns Whether the statement executed successfully
    */
   public async invoke(payload:any, path?:string) : Promise<any>
   {
      if (!path) path = "";

      if (path.startsWith("/"))
         path = path.substring(1);

      path = this.url.toString() + path;

      let errmsg:any = null;
      let success:boolean = true;

      let response:any = await fetch(path,{method: "POST", body: JSON.stringify(payload)})
        .catch((error) => {success = false; errmsg = error});

      if (!success) throw errmsg;

      if (this.guid$ != null)
         this.last$ = KeepAlive.next(this,this.timeout$);

      return(response.json());
   }
}


class KeepAlive
{
   static next(session:Session, timeout:number) : Object
   {
      let next:Object = new Object();
      new KeepAlive().sleep(session,next,timeout);
      return(next);
   }

   private async sleep(session:Session, next:Object, timeout:number) : Promise<void>
   {
      await new Promise(resolve => setTimeout(resolve,timeout));
      session["keepalive"](next);
   }
}