/*...........................................................................*/
function CheckPinNetlabel(X, Y, Len, Orientation, SchDoc) {
    var SpatialIterator;
    var Obj;
    var result;
    // Check pin if a wire is connected
    SpatialIterator = SchDoc.SchIterator_Create;
    if (SpatialIterator == null) {
        ShowMessage("Unable to create iterator for checking pins");
        Exit;
    }
    try {
        // SpatialIterator add filtering around Pin connection point
        switch (Orientation) {
            case eRotate0: {
                SpatialIterator.AddFilter_Area(MilsToCoord(X+Len-1)
                , MilsToCoord(Y+5), MilsToCoord(X+Len+700), MilsToCoord(Y+10));
                break;
            }
            case eRotate90: {
                SpatialIterator.AddFilter_Area(MilsToCoord(X-10)
                , MilsToCoord(Y+Len-1), MilsToCoord(X+10), MilsToCoord(Y+Len+1));
                break;
            }
            case eRotate180: {
                SpatialIterator.AddFilter_Area(MilsToCoord(X-Len-2700)
                , MilsToCoord(Y), MilsToCoord(X-Len+1), MilsToCoord(Y+10));
                break;
            }
            case eRotate270: {
                SpatialIterator.AddFilter_Area(MilsToCoord(X-10)
                , MilsToCoord(Y-Len-1), MilsToCoord(X+10), MilsToCoord(Y-Len+1));
                break;
            }
        }
        result = false; // NetLabel doesn't exist yet
        Obj = SpatialIterator.FirstSchObject;  // Search the first NetLabel
        while (Obj != null) {
            // Do not add a Netlabel if there is already
            // a netlabel attached on the pin
            if (Obj.ObjectId == eNetlabel) {
                result = true;
                break;
            }
            Obj = SpatialIterator.NextSchObject;
        }
    }
    finally {
        SchDoc.SchIterator_Destroy(SpatialIterator);
    }
    return result;
}
/*...........................................................................*/
/*...........................................................................*/
function PlaceASchNetLabel(X, Y, LabelName, Rotate, SchDoc) {
    var SchNetlabel;
    SchNetlabel = SchServer.SchObjectFactory(eNetlabel,eCreate_GlobalCopy);
    if (SchNetlabel == null) {
        ShowMessage("NetLabel is not found!!!");
        return;
    }
    SchDoc.AddSchObject(SchNetlabel);
    SchNetlabel.Text = LabelName;
    SchServer.RobotManager.SendMessage(SchNetlabel.I_ObjectAddress, c_BroadCast, SCHM_BeginModify, c_NoEventData);
    SchNetlabel.MoveToXY(MilsToCoord(X), MilsToCoord(Y));
    SchNetlabel.RotateBy90(Point(MilsToCoord(X), MilsToCoord(Y)), Rotate);
    SchNetlabel.SetState_xSizeySize;
    SchServer.RobotManager.SendMessage(SchNetlabel.I_ObjectAddress, c_BroadCast, SCHM_EndModify, c_NoEventData);
    SchServer.RobotManager.SendMessage(SchDoc.I_ObjectAddress,c_BroadCast, SCHM_PrimitiveRegistration,SchNetlabel.I_ObjectAddress);
    SchNetlabel.GraphicallyInvalidate;
}
/*...........................................................................*/
/*...........................................................................*/
function AddNetLabels () {
    var SchIterator;
    var PinIterator;
    var SchComponent;
    var SchDoc;
    var Pin;
    var Location;
    var LocX, LocY, Len;
    var LabelName;
    var Check; //???? ??? ??? ?????????? ????? ???? ? ??????

    if (SchServer == null) {
        ShowMessage("Could not connect to SchServer!");
        return;
    }
    SchDoc = SchServer.GetCurrentSchDocument;
    if (SchDoc == null) {
        ShowMessage("No Schematic document found. This script has to be started from an open Schematic Document.");
        return;
    }
    // Create an iterator to look for components only
    SchIterator = SchDoc.SchIterator_Create;
    SchIterator.AddFilter_ObjectSet(MkSet(eSchComponent));
    try {
        SchComponent = SchIterator.FirstSchObject;
        while (SchComponent != null && SchComponent.Selection == false) {
            SchComponent = SchIterator.NextSchObject;
        }
        if (SchComponent == null){
            ShowMessage("You didn't choose a component");
            return;
        }
    }
    finally {
        SchDoc.SchIterator_Destroy(SchIterator);
    }
    // Look for Pins associated with this component.
    PinIterator = SchComponent.SchIterator_Create;
    PinIterator.AddFilter_ObjectSet(MkSet(ePin));
    PinIterator.AddFilter_CurrentPartPrimitives;
    try {
        Pin = PinIterator.FirstSchObject;
        while (Pin != null) {
            Location = Pin.GetState_Location;
            LocX = Location.X / cInternalPrecision;
            LocY = Location.Y / cInternalPrecision;
            Len  = Pin.PinLength / cInternalPrecision;
            Check = CheckPinNetlabel(LocX, LocY, Len, Pin.Orientation, SchDoc);
            if (Check == false) { // This pin has or not NetLabel ?
                LabelName = SchComponent.Designator.Text + "_" + Pin.Designator + "_" + Pin.Name;
                switch (Pin.Orientation) {
                    case eRotate0: {
                        PlaceASchNetLabel(LocX + Len, LocY, LabelName
                                        , eRotate0, SchDoc);
                            break;
                    }
                    case eRotate90: {
                        PlaceASchNetLabel(LocX, LocY + Len, LabelName
                                        , eRotate90, SchDoc);
                        break;
                    }
                    case eRotate180: {
                        PlaceASchNetLabel(LocX - 3 * Len, LocY, LabelName
                                        , eRotate0, SchDoc);
                        break;
                    }
                    case eRotate270: {
                        PlaceASchNetLabel(LocX, LocY - Len, LabelName
                                        , eRotate270, SchDoc);
                        break;
                    }
                }
            }
            Pin = PinIterator.NextSchObject;
        }
    }
    finally {
        SchComponent.SchIterator_Destroy(PinIterator);
    }
}
/*...........................................................................*/
