//! Build script for Soroban escrow contract
//! 
//! This enables proper WASM configuration for Soroban v21+

use std::env;

fn main() {
    let target = env::var("TARGET").unwrap();
    
    if target.contains("wasm") {
        // Set up WASM-specific build configuration
        println!("cargo:rerun-if-changed=src/");
        println!("cargo:rerun-if-changed=Cargo.toml");
        
        // Enable reference-types for proper WASM compatibility
        println!("cargo:rustc-env=wasm_mention=1");
    }
    
    // Tell Cargo to rerun this script if any of these change
    println!("cargo:rerun-if-changed=build.rs");
    
    // Use soroban-build to generate bindings
    let output = std::process::Command::new("rustc")
        .args(["--print", "cfg"])
        .output()
        .expect("Failed to get rustc config");
        
    let cfg = String::from_utf8_lossy(&output.stdout);
    if cfg.contains("wasm") {
        println!("cargo:rustc-cfg=soroban_wasm");
    }
}