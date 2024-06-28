export class Session
{
   public static KEEPALIVE_MIN = 32;
   public static KEEPALIVE_SLACK = 8;

   private url$:URL = null;
   private guid$:string = null;

   private last$:Object = null;
   private timeout$:number = 0;

   private vpd$:{name:string, value:object}[] = [];
   private clientinfo$:{name:string, value:object}[] = [];


   public get url() : URL
   {
      let url:URL = this.url$;

      if (url == null)
			url = new URL(window.location.origin);

      return(url);
   }


   public set url(url:URL|string)
   {
      if (typeof url === "string")
			url = new URL(url);

      this.url$ = url;
   }


   public addVPDContext(name:string, value:any) : void
   {
      this.vpd$.push({name: name, value: value});
   }


   public addClientInfo(name:string, value:any) : void
   {
      this.clientinfo$.push({name: name, value: value});
   }


   public async connect(username:string, password?:string) : Promise<boolean>
   {
      let request:any =
      {
         "Session":
         {
            "invoke": "connect()",

            "connect()":
            {
               "username": username,
               "password": password
            }
         }
      }

      if (this.vpd$.length > 0)
         request.Session["connect()"].vpd = this.vpd$;

      if (this.clientinfo$.length > 0)
         request.Session["connect()"]["client-info"] = this.clientinfo$;

      let response:any = await this.invoke(request);

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


   public async setProperties() : Promise<boolean>
   {
      let request:any =
      {
         "Session":
         {
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


   public async keepalive(next:Object) : Promise<void>
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


   private async invoke(payload:any, path?:string) : Promise<any>
   {
      if (!path) path = "";

      if (path.startsWith("/"))
         path = path.substring(1);

      path = this.url.toString() + path;

      let errmsg:any = null;
      let success:boolean = true;

      let response:any = await fetch(path,{method: "POST", body: JSON.stringify(payload)})
        .catch((error) =>{success = false; errmsg = error});

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
      session.keepalive(next);
   }
}