buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:9.2.1")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.25")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
    // tauri-plugin-barcode-scanner declares consumerProguardFiles("consumer-rules.pro")
    // but neither the crate nor its upstream repo ships the file, so
    // merge*ConsumerProguardFiles fails on release builds. Create the empty
    // file for plugin projects resolved from the cargo registry.
    afterEvaluate {
        if (projectDir.path.contains("tauri-plugin-")) {
            val consumerRules = File(projectDir, "consumer-rules.pro")
            if (!consumerRules.exists()) {
                consumerRules.createNewFile()
            }
        }
    }
}

tasks.register("clean").configure {
    delete("build")
}
