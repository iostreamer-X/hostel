#Hostel

This is a simple LAN chat which is able to find peers and connect to them.
It's built on Node.js and I loved the way it works. It's not something
really serious but rather is my attempt at learning js, especially node.

Download the source by cloning and add the dependencies using `npm install`.
To use the system, try `npm link`. With this you can tinker with the code
without re installing the app.

Now that you have installed, run it like this.

```shell
hostel w
```
The 'w' is for wifi. This option lets you select the interface on which you want
this app to run. So if you are in a hostel and your LAN is through ethernet cables then
you'd use

```shell
hostel e
```

To check online users:
```shell
users
```

To connect to a user:
```shell
connect [username]
```

Once you are connected to someone, the terminal becomes your messenger. To go back to control mode, you'd
have to disconnect.

To send message:
```shell
[text message]
```

To send files:
```shell
upld [path of file]
```

![](hostel/assets/scrsht.png)
