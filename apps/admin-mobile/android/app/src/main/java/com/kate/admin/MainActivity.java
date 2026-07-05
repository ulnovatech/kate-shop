package com.kate.admin;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.kate.admin.plugins.KateApkUpdaterPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KateApkUpdaterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
