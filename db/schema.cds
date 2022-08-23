namespace defcomp.vesting;

using {
    managed,
    cuid
} from '@sap/cds/common';

entity VestingDetails : cuid, managed {
    rolecode   : String(128);
    rolename   : String(128);
    perfrating : Integer;
    paypercent : Integer;
}
